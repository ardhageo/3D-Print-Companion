package com.ardha.printcost;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;

import androidx.activity.result.ActivityResult;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "NativeFileSaver")
public class NativeFileSaverPlugin extends Plugin {

    @PluginMethod
    public void save(PluginCall call) {
        String filename = call.getString("filename");
        String content = call.getString("content");
        String mime = call.getString("mime", "application/octet-stream");

        if (filename == null || content == null) {
            call.reject("filename and content are required");
            return;
        }

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mime);
        intent.putExtra(Intent.EXTRA_TITLE, filename);

        startActivityForResult(call, intent, "saveResult");
    }

    @ActivityCallback
    private void saveResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.reject("Save canceled");
            return;
        }

        Uri uri = result.getData().getData();

        if (uri == null) {
            call.reject("No destination selected");
            return;
        }

        String content = call.getString("content");

        try (OutputStream out =
                     getContext().getContentResolver().openOutputStream(uri)) {

            if (out == null) {
                throw new IllegalStateException("Could not open destination");
            }

            out.write(content.getBytes(StandardCharsets.UTF_8));
            out.flush();

            call.resolve();

        } catch (Exception e) {
            call.reject("Could not save file", null, e);
        }
    }
}