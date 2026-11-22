# Screen Specifications

| Screen | Store Route ID | Component | Core Functionality |
| :--- | :--- | :--- | :--- |
| Splash | `splash` | `SplashScreen` | Brand emblem, courtyard backdrop, auto-bootstrap transition |
| Onboarding | `onboarding` | `OnboardingView` | 3-step skippable product introduction |
| Courtyard Hub | `home` | `HomeHub` | Resume saved match card, offline/online launchers, practice challenges, stats summary |
| Match Setup | `setup` | `MatchSetupView` | 2/3/4 players, Pass & Play vs AI difficulty, seat heroes, board theme, rule toggles |
| Characters | `characters` | `CharactersView` | 12 heroes filtered by kingdom, live 360° 3D preview, outfit/skin wardrobe, anim tests |
| Board Themes | `boards` | `BoardsView` | Select among 6 3D board themes (`royal-enchanted-courtyard` default) |
| Multiplayer | `multiplayer` | `MultiplayerView` | Create 6-char room, copy invite URL, join by code, Ready/Start, 2P/4P public queue |
| Active Game | `play` | `ActiveGameView` | Full-bleed 3D `LudoBoardViewport` or `Board2DFallback`, HUD dock, camera controls, pause, victory |
| Chronicle | `chronicle` | `ChronicleView` | Tabs for Match History, Statistics, Achievements, and Hero Collection |
| Profile | `profile` | `ProfileView` | Guest profile editing + optional Firebase Google Sign-In, Sign Out, Delete Account |
| Settings | `settings` | `SettingsView` | General, Audio/Haptics, 3D Graphics Quality, Language (5 locales), Privacy, DB Config |
| Help & Rules | `help` | `HelpAndAboutView` | Official Ludo rules, keyboard controls, and asset license credits |
