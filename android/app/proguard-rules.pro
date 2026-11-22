# Preserve Capacitor Bridge and WebView JavascriptInterface classes
-keep class com.getcapacitor.** { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod <methods>;
}
