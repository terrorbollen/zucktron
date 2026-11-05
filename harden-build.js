import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { flipFuses, FuseV1Options, FuseVersion } from '@electron/fuses';

const BINARIES = { darwin: 'Zucktron.app', linux: 'Zucktron', win32: 'Zucktron.exe' };

for (const dir of readdirSync('dist')) {
  const [, platform, arch] = dir.split('-');
  await flipFuses(join('dist', dir, BINARIES[platform]), {
    version: FuseVersion.V1,
    // Flipping fuses invalidates the signature, and arm64 Macs refuse to run unsigned code.
    resetAdHocDarwinSignature: platform === 'darwin' && arch === 'arm64',
    [FuseV1Options.EnableCookieEncryption]: true,
    [FuseV1Options.RunAsNode]: false,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    [FuseV1Options.EnableNodeCliInspectArguments]: false,
  });
}
