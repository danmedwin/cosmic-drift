import UIKit
import Capacitor

// Hosts the Capacitor web view. Two jobs:
// 1. Register the app's own plugins (Game Center).
// 2. Keep the web view inside the safe area so the HUD, splash and Workshop top bars never sit under
//    the notch or the home indicator. Capacitor makes the web view the controller's root view, so we
//    swap in a navy container (#0b0c1a, the colour both pages already use) and pin the web view to the
//    container's safe-area guide. The bands outside it read as part of the same surface.
class CDViewController: CAPBridgeViewController {
    private let navy = UIColor(red: 11.0 / 255.0, green: 12.0 / 255.0, blue: 26.0 / 255.0, alpha: 1.0)

    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(GameCenterPlugin())
    }

    override open func viewDidLoad() {
        super.viewDidLoad()
        guard let wv = webView, view === wv else { return }
        let container = UIView(frame: wv.frame)
        container.backgroundColor = navy
        container.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        wv.removeFromSuperview()
        wv.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(wv)
        let guide = container.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            wv.topAnchor.constraint(equalTo: guide.topAnchor),
            wv.bottomAnchor.constraint(equalTo: guide.bottomAnchor),
            wv.leadingAnchor.constraint(equalTo: guide.leadingAnchor),
            wv.trailingAnchor.constraint(equalTo: guide.trailingAnchor)
        ])
        view = container
        setStatusBarStyle(.lightContent)
    }
}
