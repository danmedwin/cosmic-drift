import Foundation
import Capacitor
import GameKit

// Local Capacitor plugin: Game Center leaderboards.
// JS side: window.Capacitor.Plugins.GameCenter (see the CDNative helper in build.js).
// Leaderboard IDs live in GAMECENTER.md and must exist in App Store Connect.
@objc(GameCenterPlugin)
public class GameCenterPlugin: CAPPlugin, CAPBridgedPlugin, GKGameCenterControllerDelegate {
    public let identifier = "GameCenterPlugin"
    public let jsName = "GameCenter"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAuthenticated", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "submitScore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showLeaderboard", returnType: CAPPluginReturnPromise)
    ]

    // Sign-in UI Game Center handed us (only when the player is not signed in at the OS level).
    // We hold it and present it on demand (Leaderboards tap) instead of interrupting launch.
    private var pendingAuthViewController: UIViewController?
    private var pendingSignInCall: CAPPluginCall?

    override public func load() {
        GKLocalPlayer.local.authenticateHandler = { [weak self] viewController, _ in
            guard let self = self else { return }
            if let vc = viewController {
                self.pendingAuthViewController = vc
                return
            }
            self.pendingAuthViewController = nil
            let ok = GKLocalPlayer.local.isAuthenticated
            if ok { GKAccessPoint.shared.isActive = false }
            if let call = self.pendingSignInCall {
                self.pendingSignInCall = nil
                call.resolve(["authenticated": ok])
            }
            self.notifyListeners("authChanged", data: ["authenticated": ok])
        }
    }

    @objc func isAuthenticated(_ call: CAPPluginCall) {
        call.resolve(["authenticated": GKLocalPlayer.local.isAuthenticated])
    }

    @objc func signIn(_ call: CAPPluginCall) {
        if GKLocalPlayer.local.isAuthenticated {
            call.resolve(["authenticated": true])
            return
        }
        DispatchQueue.main.async {
            if let vc = self.pendingAuthViewController, let host = self.bridge?.viewController {
                self.pendingSignInCall = call
                host.present(vc, animated: true)
            } else {
                call.resolve(["authenticated": false])
            }
        }
    }

    @objc func submitScore(_ call: CAPPluginCall) {
        guard let leaderboardId = call.getString("leaderboardId"), let score = call.getInt("score") else {
            call.reject("leaderboardId and score are required")
            return
        }
        guard GKLocalPlayer.local.isAuthenticated else {
            call.resolve(["submitted": false, "reason": "notAuthenticated"])
            return
        }
        GKLeaderboard.submitScore(score, context: 0, player: GKLocalPlayer.local, leaderboardIDs: [leaderboardId]) { error in
            if let error = error {
                call.resolve(["submitted": false, "reason": error.localizedDescription])
            } else {
                call.resolve(["submitted": true])
            }
        }
    }

    @objc func showLeaderboard(_ call: CAPPluginCall) {
        let leaderboardId = call.getString("leaderboardId")
        DispatchQueue.main.async {
            guard let host = self.bridge?.viewController else { call.reject("no view controller"); return }
            if !GKLocalPlayer.local.isAuthenticated {
                if let vc = self.pendingAuthViewController {
                    host.present(vc, animated: true)
                    call.resolve(["shown": false, "signInShown": true])
                } else {
                    call.resolve(["shown": false, "signInShown": false])
                }
                return
            }
            let gc: GKGameCenterViewController
            if let id = leaderboardId {
                gc = GKGameCenterViewController(leaderboardID: id, playerScope: .global, timeScope: .allTime)
            } else {
                gc = GKGameCenterViewController(state: .leaderboards)
            }
            gc.gameCenterDelegate = self
            host.present(gc, animated: true)
            call.resolve(["shown": true])
        }
    }

    public func gameCenterViewControllerDidFinish(_ gameCenterViewController: GKGameCenterViewController) {
        gameCenterViewController.dismiss(animated: true)
    }
}
