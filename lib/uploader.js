

const { Storage } = require('@google-cloud/storage');
const { isDirectory, makeAbsolute, getFilesToUpload } = require('./file-util');

function uploadToGCS(bucket, cacheControl, validate, resume, timeoutMs, asset) {
    const uploadOpt = {
        destination: asset.destination,
        validation: validate,
        resumable: resume,
        timeout: timeoutMs,
        public: true,
        gzip: true,
        metadata: { cacheControl },
    };
    return bucket.upload(asset.path, uploadOpt).then(() => asset);
}

function uploadToCloud(options, assets) {
    const {
        projectId,
        credentials,
        bucketName,
        cacheControl,
        validation,
        resumable,
        timeout,
    } = options;

    const storage = new Storage({
        projectId,
        credentials,
    });

    const bucket = storage.bucket(bucketName);

    return Promise.all(
        assets.map(asset =>
            uploadToGCS(bucket, cacheControl, validation, resumable, timeout, asset)
        )
    );
}

function getAllAssetsToUpload(options) {
    const assetsFolder = makeAbsolute(options.assetsFolder);

    if (!isDirectory(assetsFolder)) {
        throw new Error('Assets folder must be directory');
    }

    return getFilesToUpload(assetsFolder, options.flatten).map(asset =>
        ({ ...asset, destination: `${options.appPrefix}/${asset.name}`,})
    );
}

function upload(options) {
    const assets = getAllAssetsToUpload(options);

    return uploadToCloud(options, assets);
}

module.exports = { getAllAssetsToUpload, upload };
