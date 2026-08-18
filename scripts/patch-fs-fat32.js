// Comprehensive patch for FAT32 / Windows filesystems
const fs = require('fs');
const os = require('os');
const pathMod = require('path');

process.env.NEXT_TELEMETRY_DISABLED = '1';

function patchError(err, path) {
  if (err && (err.code === 'EISDIR' || err.message?.includes('illegal operation on a directory'))) {
    try {
      const lst = fs.lstatSync(path);
      if (!lst.isSymbolicLink()) {
        const newErr = new Error(`EINVAL: invalid argument, readlink '${path}'`);
        newErr.code = 'EINVAL';
        newErr.errno = -4071;
        newErr.syscall = 'readlink';
        newErr.path = String(path);
        return newErr;
      }
    } catch {
      const newErr = new Error(`EINVAL: invalid argument, readlink '${path}'`);
      newErr.code = 'EINVAL';
      newErr.errno = -4071;
      newErr.syscall = 'readlink';
      newErr.path = String(path);
      return newErr;
    }
  }
  return err;
}

const origReadlinkSync = fs.readlinkSync;
fs.readlinkSync = function (path, options) {
  try {
    return origReadlinkSync.call(fs, path, options);
  } catch (err) {
    throw patchError(err, path);
  }
};

const origReadlink = fs.readlink;
fs.readlink = function (path, ...args) {
  const cb = args[args.length - 1];
  if (typeof cb === 'function') {
    args[args.length - 1] = function (err, result) {
      if (err) {
        return cb(patchError(err, path), result);
      }
      return cb(null, result);
    };
    return origReadlink.call(fs, path, ...args);
  }
  return origReadlink.call(fs, path, ...args);
};

if (fs.promises && fs.promises.readlink) {
  const origPromisesReadlink = fs.promises.readlink;
  fs.promises.readlink = async function (path, options) {
    try {
      return await origPromisesReadlink.call(fs.promises, path, options);
    } catch (err) {
      throw patchError(err, path);
    }
  };
}

// Graceful fallback for trace / lock file EPERM on Windows drives
const origOpenSync = fs.openSync;
fs.openSync = function (path, flags, mode) {
  try {
    return origOpenSync.call(fs, path, flags, mode);
  } catch (err) {
    if (err && (err.code === 'EPERM' || err.code === 'EBUSY') && String(path).includes('trace')) {
      try {
        const tmpFile = pathMod.join(os.tmpdir(), `next-trace-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);
        return origOpenSync.call(fs, tmpFile, flags, mode);
      } catch {}
    }
    throw err;
  }
};

const origOpen = fs.open;
fs.open = function (path, ...args) {
  const cb = args[args.length - 1];
  if (typeof cb === 'function') {
    const wrappedCb = (err, fd) => {
      if (err && (err.code === 'EPERM' || err.code === 'EBUSY') && String(path).includes('trace')) {
        try {
          const tmpFile = pathMod.join(os.tmpdir(), `next-trace-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);
          return origOpen.call(fs, tmpFile, ...args.slice(0, -1), cb);
        } catch {}
      }
      return cb(err, fd);
    };
    return origOpen.call(fs, path, ...args.slice(0, -1), wrappedCb);
  }
  return origOpen.call(fs, path, ...args);
};
