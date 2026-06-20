// ElysiumMediaBridge.cs
using System;

class ElysiumMediaBridge {
    static void Main() {
        // Windows sagen: Ich bin ein offizieller Mediaplayer!
        var player = new Windows.Media.Playback.MediaPlayer();
        player.CommandManager.IsEnabled = true;
        
        // Das Windows-Lautstärke-Overlay konfigurieren
        var smtc = player.SystemMediaTransportControls;
        smtc.IsPlayEnabled = true;
        smtc.IsPauseEnabled = true;
        smtc.PlaybackStatus = Windows.Media.MediaPlaybackStatus.Playing;
        
        // Text für das Windows-Overlay festlegen
        smtc.DisplayUpdater.Type = Windows.Media.MediaPlaybackType.Music;
        smtc.DisplayUpdater.MusicProperties.Title = "Elysium";
        smtc.DisplayUpdater.MusicProperties.Artist = "Music Engine";
        smtc.DisplayUpdater.Update();
        
        // Wenn Windows meldet, dass die Mediataste gedrückt wurde: "TOGGLE" ausgeben
        player.CommandManager.TogglePlayPauseReceived += (s, e) => { Console.WriteLine("TOGGLE"); };
        player.CommandManager.PlayReceived += (s, e) => { Console.WriteLine("TOGGLE"); };
        player.CommandManager.PauseReceived += (s, e) => { Console.WriteLine("TOGGLE"); };
        
        // Den Hintergrundprozess unendlich laufen lassen (ohne CPU-Last)
        System.Threading.Thread.Sleep(System.Threading.Timeout.Infinite);
    }
}