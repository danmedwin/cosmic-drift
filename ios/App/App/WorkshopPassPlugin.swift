import Foundation
import Capacitor
import StoreKit

// Local Capacitor plugin: the one-time, non-consumable "Workshop Pass" via StoreKit 2 (iOS 15+).
// JS side: window.cdEntitlement in build.js (both pages). No third-party SDK, nothing leaves the
// device except the StoreKit calls Apple makes, so the privacy label stays "Data Not Collected".
//
// Methods (all resolve, never reject, so the JS layer can fall back gracefully):
//   getProduct  -> { available, id, displayPrice, displayName, description }
//   purchase    -> { entitled, state: purchased | pending | cancelled | unverified | unavailable | failed, error? }
//   restore     -> { entitled, error? }   (AppStore.sync, then re-check entitlements)
//   isEntitled  -> { entitled }           (Transaction.currentEntitlements)
// Event "entitlementChanged" { entitled } fires on every Transaction.updates delivery, so a purchase,
// refund or restore made on another device shows up while the app is running.
@objc(WorkshopPassPlugin)
public class WorkshopPassPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WorkshopPassPlugin"
    public let jsName = "WorkshopPass"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProduct", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isEntitled", returnType: CAPPluginReturnPromise)
    ]

    static let productID = "com.medwin.cosmicdrift.workshoppass"

    private var updatesTask: Task<Void, Never>?
    private var cachedProduct: Product?

    override public func load() {
        // Keep listening for the app's lifetime. Every verified transaction for our product is finished
        // (StoreKit keeps redelivering unfinished ones), then the JS side is told the current state.
        updatesTask = Task.detached(priority: .background) { [weak self] in
            for await result in Transaction.updates {
                if case .verified(let tx) = result, tx.productID == WorkshopPassPlugin.productID {
                    await tx.finish()
                }
                let entitled = await WorkshopPassPlugin.checkEntitled()
                self?.notifyListeners("entitlementChanged", data: ["entitled": entitled])
            }
        }
    }

    deinit {
        updatesTask?.cancel()
    }

    // True when a verified, unrevoked transaction for the pass is among the current entitlements.
    static func checkEntitled() async -> Bool {
        for await result in Transaction.currentEntitlements {
            if case .verified(let tx) = result, tx.productID == productID, tx.revocationDate == nil {
                return true
            }
        }
        return false
    }

    private func loadProduct() async throws -> Product? {
        if let p = cachedProduct { return p }
        let products = try await Product.products(for: [WorkshopPassPlugin.productID])
        cachedProduct = products.first
        return cachedProduct
    }

    @objc func getProduct(_ call: CAPPluginCall) {
        Task {
            do {
                guard let p = try await loadProduct() else {
                    call.resolve(["available": false, "error": "Product not found"])
                    return
                }
                call.resolve([
                    "available": true,
                    "id": p.id,
                    "displayPrice": p.displayPrice,
                    "displayName": p.displayName,
                    "description": p.description
                ])
            } catch {
                call.resolve(["available": false, "error": error.localizedDescription])
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        Task {
            do {
                guard let product = try await loadProduct() else {
                    call.resolve(["entitled": false, "state": "unavailable"])
                    return
                }
                let result: Product.PurchaseResult
                if #available(iOS 18.2, *), let host = await MainActor.run(body: { self.bridge?.viewController }) {
                    result = try await product.purchase(confirmIn: host)
                } else {
                    result = try await product.purchase()
                }
                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let tx):
                        await tx.finish()
                        call.resolve(["entitled": true, "state": "purchased"])
                    case .unverified(_, let err):
                        call.resolve(["entitled": false, "state": "unverified", "error": err.localizedDescription])
                    }
                case .pending:
                    // Ask to Buy / SCA: the transaction arrives later through Transaction.updates.
                    call.resolve(["entitled": false, "state": "pending"])
                case .userCancelled:
                    call.resolve(["entitled": false, "state": "cancelled"])
                @unknown default:
                    call.resolve(["entitled": false, "state": "failed"])
                }
            } catch {
                call.resolve(["entitled": false, "state": "failed", "error": error.localizedDescription])
            }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            var syncError: String? = nil
            do {
                try await AppStore.sync()
            } catch {
                // Cancelling the sign-in sheet lands here; the entitlement check below is still valid.
                syncError = error.localizedDescription
            }
            let entitled = await WorkshopPassPlugin.checkEntitled()
            var data: [String: Any] = ["entitled": entitled]
            if let e = syncError { data["error"] = e }
            call.resolve(data)
        }
    }

    @objc func isEntitled(_ call: CAPPluginCall) {
        Task {
            call.resolve(["entitled": await WorkshopPassPlugin.checkEntitled()])
        }
    }
}
