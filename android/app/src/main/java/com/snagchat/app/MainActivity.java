package com.snagchat.app;

import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

/**
 * SnagChat on Android: the built web app, served out of the APK's assets from
 * https://appassets.androidplatform.net/ so localStorage and IndexedDB (uploaded clips)
 * behave the way they do on the web instead of being blocked on file://.
 */
public class MainActivity extends AppCompatActivity {
  private WebView webView;
  private WebViewAssetLoader assetLoader;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    assetLoader = new WebViewAssetLoader.Builder()
        .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
        .build();

    setContentView(R.layout.activity_main);
    webView = findViewById(R.id.webview);

    WebSettings settings = webView.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setDatabaseEnabled(true);
    // The feed autoplays muted clips, which needs no user gesture.
    settings.setMediaPlaybackRequiresUserGesture(false);
    settings.setAllowFileAccess(false);
    settings.setAllowContentAccess(false);

    webView.setWebViewClient(new WebViewClientCompat() {
      @Override
      public WebResourceResponse shouldInterceptRequest(
          @NonNull WebView view, @NonNull WebResourceRequest request) {
        return assetLoader.shouldInterceptRequest(request.getUrl());
      }
    });

    if (savedInstanceState == null) {
      webView.loadUrl("https://appassets.androidplatform.net/index.html");
    } else {
      webView.restoreState(savedInstanceState);
    }
  }

  @Override
  protected void onSaveInstanceState(@NonNull Bundle outState) {
    super.onSaveInstanceState(outState);
    webView.saveState(outState);
  }

  @Override
  public void onBackPressed() {
    if (webView.canGoBack()) {
      webView.goBack();
      return;
    }
    super.onBackPressed();
  }
}
