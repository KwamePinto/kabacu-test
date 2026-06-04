const crypto = require("crypto");
const md5 = require("md5");

function sortParams(body) {

    return Object.keys(body)

        .sort()

        .filter(key =>
            key !== "sign" &&
            body[key] !== undefined &&
            body[key] !== null &&
            body[key] !== ""
        )

        .map(key => `${key}=${body[key]}`)
        .join("&");
}

function buildDigest(body) {

    const sorted = sortParams(body);

    console.log("SIGN STRING:", sorted);

    const hash =
        md5(sorted)
        .toUpperCase();

    console.log("The MD5:", hash);

    return hash;
}

function generateSignature(body, privateKeyPEM) {

    if (!privateKeyPEM)
        throw new Error("Missing private key");

    const digest =
        buildDigest(body);

    const signer =
        crypto.createSign("RSA-SHA1");

    signer.update(digest);

    signer.end();

    return signer.sign(
        privateKeyPEM,
        "base64"
    );
}

function verifySignature(body, publicKeyPEM) {

    const sorted = Object.keys(body)
        .sort()
        .filter(key =>
            key !== "sign" &&
            body[key] !== undefined &&
            body[key] !== null &&
            body[key] !== ""
        )
        .map(key => `${key}=${body[key]}`)
        .join("&");

    console.log("VERIFY STRING:", sorted);

    const signature = decodeURIComponent(body.sign);

    const verifier = crypto.createVerify("RSA-SHA1");

    verifier.update(sorted);   // ✅ NO MD5 ANYWHERE
    verifier.end();

    return verifier.verify(publicKeyPEM, signature, "base64");
}

module.exports = {
    sortParams,
    buildDigest,
    generateSignature,
    verifySignature
};