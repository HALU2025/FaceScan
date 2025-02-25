const startScanBtn = document.getElementById('startScan');
const video = document.getElementById('video');
const captureBtn = document.getElementById('capture');
const analyzeBtn = document.getElementById('analyze');
const canvas = document.getElementById('canvas');
const preview = document.getElementById('preview');

let currentImageData = ''; // 画像データを保持

// **診断を開始（カメラ起動）**
startScanBtn.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        video.srcObject = stream;
        video.style.display = "block";
        captureBtn.style.display = "block";
        startScanBtn.style.display = "none"; // 診断開始ボタンを非表示に
    } catch (err) {
        alert("カメラのアクセスが許可されていません。設定を確認してください。");
        console.error("カメラ起動エラー:", err);
    }
});

// **撮影処理**
captureBtn.addEventListener('click', () => {
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    currentImageData = canvas.toDataURL('image/jpeg', 0.7);
    preview.src = currentImageData;
    preview.style.display = "block";

    analyzeBtn.style.display = "block"; // 診断ボタンを表示
    captureBtn.style.display = "none";  // 撮影ボタンを非表示
    video.style.display = "none";       // カメラ映像を非表示
});

// **診断処理**
analyzeBtn.addEventListener('click', () => {
    if (!currentImageData) {
        alert("画像を撮影してください！");
        return;
    }

    fetch('https://facescan-api.onrender.com/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: currentImageData })
    })
    .then(response => response.json())
    .then(result => {
        console.log('サーバーからのレスポンス:', result);
        alert(result.result);
    })
    .catch(error => {
        console.error('エラー発生:', error);
        alert("診断に失敗しました。");
    });
});


// ✅ 診断結果の画像化機能
const shareBtn = document.createElement('button');
shareBtn.textContent = '診断結果を画像で保存';
document.body.appendChild(shareBtn);

shareBtn.addEventListener('click', () => {
    if (!currentResult) {
        alert("診断結果がありません！");
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 500;
    canvas.height = 300;

    // 背景の描画
    ctx.fillStyle = "#f9f9f9"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // テキストのスタイル
    ctx.fillStyle = "#333";
    ctx.font = "20px Arial";
    ctx.fillText("【診断結果】", 20, 40);

    // 診断結果のテキストを描画
    const lines = currentResult.split("\n");
    let y = 80;
    lines.forEach(line => {
        ctx.fillText(line, 20, y);
        y += 30;
    });

    // 画像を作成
    const resultImage = canvas.toDataURL('image/png');

    // 画像をダウンロード
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = "診断結果.png";
    link.click();
});

// ✅ シェアボタンの作成
const twitterBtn = document.createElement('button');
twitterBtn.textContent = 'Twitterでシェア';
document.body.appendChild(twitterBtn);

const lineBtn = document.createElement('button');
lineBtn.textContent = 'LINEでシェア';
document.body.appendChild(lineBtn);

twitterBtn.addEventListener('click', () => {
    const text = encodeURIComponent("【診断結果】\nあなたの顔の診断結果が出ました！\n\n #FaceScan #診断アプリ");
    const url = encodeURIComponent(window.location.href);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    window.open(twitterUrl, '_blank');
});

lineBtn.addEventListener('click', () => {
    const text = encodeURIComponent("【診断結果】\nあなたの顔の診断結果が出ました！\n\n #FaceScan #診断アプリ");
    const lineUrl = `https://line.me/R/msg/text/?${text}`;
    window.open(lineUrl, '_blank');
});
