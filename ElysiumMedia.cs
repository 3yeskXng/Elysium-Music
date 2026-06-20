using System;
using System.Windows.Forms;
using System.Runtime.InteropServices;

class MediaListener : NativeWindow {
    [DllImport("user32.dll")]
    private static extern bool RegisterHotKey(IntPtr hWnd, int id, int fsModifiers, int vk);

    public MediaListener() {
        // Erstellt ein reines System-Handle im Arbeitsspeicher. 
        // Hier KANN sich physisch überhaupt kein Fenster öffnen!
        CreateHandle(new CreateParams());
        
        // Registriert die echte Medien-Pause-Taste (0xCD) direkt bei Windows
        RegisterHotKey(this.Handle, 100, 0, 0xCD); 
    }

    protected override void WndProc(ref Message m) {
        // 0x0312 = Windows-Signal für Hotkey
        if (m.Msg == 0x0312 && m.WParam.ToInt32() == 100) {
            Console.WriteLine("TOGGLE"); // Signal an Node.js senden
        }
        base.WndProc(ref m);
    }

    public static void Main() {
        var listener = new MediaListener();
        Application.Run(); // Hält das Skript unsichtbar am Leben
    }
}
