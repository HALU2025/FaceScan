// DOM要素の取得
const startScanBtn = document.getElementById('startScan'); // 「診断を開始」ボタン
const video = document.getElementById('video');            // カメラ映像用のvideo要素
const captureBtn = document.getElementById('capture');       // 「撮影」ボタン
const analyzeBtn = document.getElementById('analyze');       // 「この写真で診断」ボタン
const canvas = document.getElementById('canvas');            // 撮影結果用のcanvas
const preview = document.getElementById('preview');          // 撮影・参照画像のプレビュー用

let currentImageData = '';   // 撮影または参照した画像データを保持
let currentResult = "";      // AI診断の結果を保持

// ★ 画像参照用のファイル入力要素を動的に作成（復活）
// ※ 初期状態では非表示にする
const fileInput = document.createElement('input');
fileInput.type = "file";
fileInput.id = "fileInput";
fileInput.accept = "image/*";
fileInput.style.display = "none";  // 初期は非表示
document.body.appendChild(fileInput);

/* 
  動作フロー：
  1. 初期状態: 「診断を開始」ボタンのみ表示。
  2. 「診断を開始」ボタンを押す → カメラ起動し、video, 「撮影」ボタン、及び画像参照ボタン(fileInput) を表示。
  3. 撮影またはファイル参照が完了すると、video, 撮影ボタン, fileInput を非表示にし、「この写真で診断」ボタンを表示。
*/

// 【診断を開始】ボタン押下でカメラ起動＆画像参照ボタン表示
startScanBtn.addEventListener('click', async () => {
    try {
        // カメラを取得（インカメラ指定）
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        video.srcObject = stream;
        video.style.display = "block";       // カメラ映像を表示
        captureBtn.style.display = "inline-block"; // 撮影ボタンを表示
        fileInput.style.display = "inline-block";  // 画像参照ボタンを表示
        startScanBtn.style.display = "none";   // 診断開始ボタンは非表示
        await video.play();
    } catch (err) {
        alert("カメラのアクセスが許可されていません。設定を確認してください。");
        console.error("カメラ起動エラー:", err);
    }
});

// 【撮影処理】 撮影ボタン押下で video から canvas に画像をキャプチャ
captureBtn.addEventListener('click', () => {
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // canvas の画像データを JPEG 形式（70%画質）で取得
    currentImageData = canvas.toDataURL('image/jpeg', 0.7);
    preview.src = currentImageData;
    preview.style.display = "block";

    // 撮影完了後、カメラ映像、撮影ボタン、ファイル参照ボタンを非表示し、「この写真で診断」ボタンを表示
    video.style.display = "none";
    captureBtn.style.display = "none";
    fileInput.style.display = "none";
    analyzeBtn.style.display = "block";
});

// 【ファイル選択処理】 画像参照でユーザーが画像を選択した場合
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentImageData = e.target.result;
            preview.src = currentImageData;
            preview.style.display = "block";
            // 画像参照完了後、video, 撮影ボタン, fileInput を非表示し、「この写真で診断」ボタンを表示
            video.style.display = "none";
            captureBtn.style.display = "none";
            fileInput.style.display = "none";
            analyzeBtn.style.display = "block";
        };
        reader.readAsDataURL(file);
    }
});

// 【診断処理】 「この写真で診断」ボタンが押されたら、画像データをバックエンドに送信して診断結果を取得
analyzeBtn.addEventListener('click', () => {
    if (!currentImageData) {
        alert("画像を撮影または参照してください！");
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
        currentResult = result.result;  // 診断結果を保存
        // 診断結果を画像化して、プレビューに表示する
        displayResultImage(currentResult);
    })
    .catch(error => {
        console.error('エラー発生:', error);
        alert("診断に失敗しました。");
    });
});

// 【診断結果の画像化機能】 診断結果のテキストをCanvasに描画し、画像データに変換してプレビューに表示
function displayResultImage(resultText) {
    const resultCanvas = document.createElement('canvas');
    const ctx = resultCanvas.getContext('2d');
  
    resultCanvas.width = 500;
    resultCanvas.height = 300;
  
    // 背景を描画
    ctx.fillStyle = "#f9f9f9";
    ctx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
  
    // テキストスタイル設定
    ctx.fillStyle = "#333";
    ctx.font = "20px Arial";
    ctx.fillText("【診断結果】", 20, 40);
  
    // 結果のテキストを改行で分割し、行ごとに描画
    const lines = resultText.split("\n");
    let y = 80;
    lines.forEach(line => {
        ctx.fillText(line, 20, y);
        y += 30;
    });
  
    // Canvasから画像データを取得
    const resultImageData = resultCanvas.toDataURL('image/png');
    // プレビュー画像を診断結果画像に置き換え
    preview.src = resultImageData;
    preview.style.display = "block";
}

// 【シェア機能】 Twitter と LINE で診断結果をシェアするボタンを動的に作成
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
