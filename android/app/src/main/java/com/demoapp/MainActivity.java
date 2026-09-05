package com.demoapp;
import android.app.*;import android.os.*;import android.content.*;import android.net.Uri;import android.provider.MediaStore;import android.webkit.*;import android.graphics.Bitmap;import android.graphics.BitmapFactory;import android.util.Base64;import java.io.*;
public class MainActivity extends Activity{
 WebView web; String lastPath;
 public void onCreate(Bundle b){super.onCreate(b);web=new WebView(this);web.getSettings().setJavaScriptEnabled(true);web.getSettings().setDomStorageEnabled(true);web.addJavascriptInterface(new Bridge(this),"Android");web.loadUrl("file:///android_asset/index.html");setContentView(web);}
 class Bridge{Context c;Bridge(Context c){this.c=c;}
  @JavascriptInterface public void saveImage(String data){lastPath=save(data);}
  @JavascriptInterface public void shareImage(String data){String p=lastPath!=null?lastPath:save(data);Intent i=new Intent(Intent.ACTION_SEND);i.setType("image/png");i.putExtra(Intent.EXTRA_STREAM,Uri.parse(p));startActivity(Intent.createChooser(i,"Share quotation"));}
  String save(String data){try{String b64=data.substring(data.indexOf(',')+1);byte[] bytes=Base64.decode(b64,Base64.DEFAULT);String name="quotation_"+System.currentTimeMillis()+".png";ContentValues v=new ContentValues();v.put(MediaStore.Images.Media.DISPLAY_NAME,name);v.put(MediaStore.Images.Media.MIME_TYPE,"image/png");v.put(MediaStore.Images.Media.RELATIVE_PATH,"Pictures/DemoAPP");Uri u=getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI,v);OutputStream o=getContentResolver().openOutputStream(u);o.write(bytes);o.close();return u.toString();}catch(Exception e){return null;}}
 }
}
