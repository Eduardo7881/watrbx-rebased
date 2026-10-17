const fpPromise = import('https://openfpcdn.io/fingerprintjs/v5')
    .then(FingerprintJS => FingerprintJS.load())

async function sendFingerprint() {
      fpPromise
        .then(fp => fp.get())
        .then(result => {

        fetch('/api/v1/fingerprints/submit-fingerprint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                visitorId: result.visitorId,
                confidence: result.confidence.score,
            })
        })
        .then(r => r.json())
        .then(data => console.log("Server response:", data))
        .catch(err => console.error(err));

    });
}


window.addEventListener('load', sendFingerprint);