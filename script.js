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
// 初期状態では非表示
const fileInput = document.createElement('input');
fileInput.type = "file";
fileInput.id = "fileInput";
fileInput.accept = "image/*";
fileInput.style.display = "none";
document.body.appendChild(fileInput);

// ★ シェアボタン関連は初期状態で非表示
const shareBtn = document.createElement('button');
shareBtn.textContent = '診断結果を画像で保存';
shareBtn.style.display = "none";
document.body.appendChild(shareBtn);

const twitterBtn = document.createElement('button');
twitterBtn.textContent = 'Twitterでシェア';
twitterBtn.style.display = "none";
document.body.appendChild(twitterBtn);

const lineBtn = document.createElement('button');
lineBtn.textContent = 'LINEでシェア';
lineBtn.style.display = "none";
document.body.appendChild(lineBtn);

// ★ 「もう一回診断する」ボタンを動的に作成（初期状態非表示）
const retryBtn = document.createElement('button');
retryBtn.textContent = 'もう一回診断する';
retryBtn.style.display = "none";
document.body.appendChild(retryBtn);

/*
  動作フロー：
  1. 初期状態：診断開始ボタンのみ表示
  2. 「診断を開始」→カメラ起動し、video, 撮影ボタン, 画像参照ボタン(fileInput)を表示
  3. 撮影または画像参照完了→「この写真で診断」ボタンを表示、video, 撮影ボタン, fileInputは非表示
  4. 診断結果取得→「この写真で診断」ボタンを非表示、シェアボタン群と「もう一回診断する」ボタンを表示
*/

// 【診断を開始】ボタン押下でカメラ起動＆画像参照ボタン表示
startScanBtn.addEventListener('click', async () => {
    try {
        // カメラの取得（インカメラ指定）
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        video.srcObject = stream;
        video.style.display = "block";           // カメラ映像を表示
        captureBtn.style.display = "inline-block"; // 撮影ボタンを表示
        fileInput.style.display = "inline-block";  // 画像参照ボタンを表示
        startScanBtn.style.display = "none";       // 診断開始ボタンは非表示
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

    // canvas の画像データを JPEG形式（70%画質）に変換して保存
    currentImageData = canvas.toDataURL('image/jpeg', 0.7);
    preview.src = currentImageData;
    preview.style.display = "block";

    // 撮影完了後、video, 撮影ボタン, 画像参照ボタンを非表示し、「この写真で診断」ボタンを表示
    video.style.display = "none";
    captureBtn.style.display = "none";
    fileInput.style.display = "none";
    analyzeBtn.style.display = "block";
});

// 【ファイル選択処理】 ユーザーがファイルを選択した場合、画像をプレビューに表示
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentImageData = e.target.result; // 選択した画像データを保存
            preview.src = currentImageData;
            preview.style.display = "block";
            // 画像参照完了後、video, 撮影ボタン, 画像参照ボタンを非表示し、「この写真で診断」ボタンを表示
            video.style.display = "none";
            captureBtn.style.display = "none";
            fileInput.style.display = "none";
            analyzeBtn.style.display = "block";
        };
        reader.readAsDataURL(file);
    }
});

// 【診断処理】 「この写真で診断」ボタンが押されたら、画像データをバックエンドに送信して診断結果を取得する
analyzeBtn.addEventListener('click', () => {
    if (!currentImageData) {
        alert("画像を撮影または参照してください！");
        return;
    }
    // APIリクエスト（RenderにデプロイしたバックエンドのURL）
    fetch('https://facescan-api.onrender.com/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: currentImageData })
    })
    .then(response => response.json())
    .then(result => {
        console.log('サーバーからのレスポンス:', result);
        currentResult = result.result;  // 診断結果を保存
        // 診断結果を画像化してプレビューに表示する
        displayResultImage(currentResult);
        // 診断結果取得後、診断ボタンを非表示し、シェアボタン群と「もう一回診断する」ボタンを表示
        analyzeBtn.style.display = "none";
        shareBtn.style.display = "block";
        twitterBtn.style.display = "inline-block";
        lineBtn.style.display = "inline-block";
        retryBtn.style.display = "block";
    })
    .catch(error => {
        console.error('エラー発生:', error);
        alert("診断に失敗しました。");
    });
});

// 【診断結果の画像化機能】 診断結果のテキストをCanvasに描画し、画像に変換してプレビューに表示
function displayResultImage(resultText) {
    const resultCanvas = document.createElement('canvas');
    const ctx = resultCanvas.getContext('2d');
  
    resultCanvas.width = 500;
    resultCanvas.height = 300;
  
    // 背景描画
    ctx.fillStyle = "#f9f9f9";
    ctx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
  
    // テキストスタイルの設定
    ctx.fillStyle = "#333";
    ctx.font = "20px Arial";
    ctx.fillText("【診断結果】", 20, 40);
  
    // 診断結果のテキストを改行で分割し、行ごとに描画
    const lines = resultText.split("\n");
    let y = 80;
    lines.forEach(line => {
        ctx.fillText(line, 20, y);
        y += 30;
    });
  
    // Canvasから画像データを生成
    const resultImageData = resultCanvas.toDataURL('image/png');
    // プレビュー画像を診断結果の画像に置き換える
    preview.src = resultImageData;
    preview.style.display = "block";
}

// 【シェア機能】 Twitter と LINE のシェアボタン
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

// 【もう一回診断する】ボタンの処理：インターフェースをリセットして最初の状態に戻す
retryBtn.addEventListener('click', () => {
    // リセット処理：診断結果、プレビューをクリアし、初期状態のボタンを表示
    currentImageData = "";
    currentResult = "";
    preview.src = "";
    preview.style.display = "none";
    analyzeBtn.style.display = "none";
    shareBtn.style.display = "none";
    twitterBtn.style.display = "none";
    lineBtn.style.display = "none";
    retryBtn.style.display = "none";
    // 初期状態：診断開始ボタンを表示、カメラ映像はそのまま（再起動は不要）
    startScanBtn.style.display = "block";
});
