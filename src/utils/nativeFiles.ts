import { Capacitor, registerPlugin } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface NativeFileSaverPlugin {
  save(options: {
    filename: string;
    content: string;
    mime: string;
  }): Promise<void>;
}

const NativeFileSaver = registerPlugin<NativeFileSaverPlugin>('NativeFileSaver');
function isNativeAndroid() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

async function contentToBase64(content: string, mime: string): Promise<string> {
  const blob = new Blob([content], { type: mime });
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error || new Error('Could not encode file'));
    reader.readAsDataURL(blob);
  });
}

export async function shareExportFile(filename: string, content: string, mime: string) {
  if (!isNativeAndroid()) return false;

  const base64 = await contentToBase64(content, mime);
  await Filesystem.writeFile({
    path: `PrintCost/${filename}`,
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  });

  const uri = await Filesystem.getUri({
    path: `PrintCost/${filename}`,
    directory: Directory.Cache,
  });

  await Share.share({
    title: 'PrintCost export',
    text: filename,
    files: [uri.uri],
    dialogTitle: 'Share PrintCost export',
  });

  return true;
}

export async function saveExportFile(
  filename: string,
  content: string,
  mime: string
) {
  if (!isNativeAndroid()) return false;

  await NativeFileSaver.save({
    filename,
    content,
    mime,
  });

  return true;
}
