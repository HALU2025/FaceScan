// ===================== 1. 初期設定と DOM 要素の取得 =====================
const startScanBtn = document.getElementById('startScan'); // 診断開始ボタン
const video = document.getElementById('video');            // カメラ映像表示用
const captureBtn = document.getElementById('capture');       // 撮影ボタン
const analyzeBtn = document.getElementById('analyze');       // 「この写真で診断」ボタン
const canvas = document.getElementById('canvas');            // 撮影結果用キャンバス
const preview = document.getElementById('preview');          // プレビュー画像

// グローバル変数
let currentImageData = "";   // 撮影または選択した画像データ
let currentResult = "";      // AI診断結果のテキスト
let mode = "";               // "capture"（撮影）または "file"（画像参照）を記録

// 追加のUI要素（初期は非表示）
const fileInput = document.createElement('input');
fileInput.type = "file";
fileInput.id = "fileInput";
fileInput.accept = "image/*";
fileInput.style.display = "none";
document.body.appendChild(fileInput);

const reCaptureBtn = document.createElement('button');
reCaptureBtn.textContent = "再撮影する";
reCaptureBtn.style.display = "none";
document.body.appendChild(reCaptureBtn);

const selectAgainBtn = document.createElement('button');
selectAgainBtn.textContent = "画像を選びなおす";
selectAgainBtn.style.display = "none";
document.body.appendChild(selectAgainBtn);

const takePhotoBtn = document.createElement('button');
takePhotoBtn.textContent = "写真を撮影する";
takePhotoBtn.style.display = "none";
document.body.appendChild(takePhotoBtn);

const retryBtn = document.createElement('button');
retryBtn.textContent = "もう一回診断する";
retryBtn.style.display = "none";
document.body.appendChild(retryBtn);

const shareBtn = document.createElement('button');
shareBtn.textContent = "診断結果を画像で保存";
shareBtn.style.display = "none";
document.body.appendChild(shareBtn);

const twitterBtn = document.createElement('button');
twitterBtn.textContent = "Twitterでシェア";
twitterBtn.style.display = "none";
document.body.appendChild(twitterBtn);

const lineBtn = document.createElement('button');
lineBtn.textContent = "LINEでシェア";
lineBtn.style.display = "none";
document.body.appendChild(lineBtn);

// ===================== 2. ユーティリティ関数と状態リセット =====================
function resetToInitial() {
  startScanBtn.style.display = "block";
  video.style.display = "none";
  captureBtn.style.display = "none";
  fileInput.style.display = "none";
  analyzeBtn.style.display = "none";
  reCaptureBtn.style.display = "none";
  selectAgainBtn.style.display = "none";
  takePhotoBtn.style.display = "none";
  retryBtn.style.display = "none";
  shareBtn.style.display = "none";
  twitterBtn.style.display = "none";
  lineBtn.style.display = "none";
  preview.style.display = "none";
  currentImageData = "";
  currentResult = "";
  mode = "";
}
resetToInitial();

function isMobile() {
  return /Mobi|Android/i.test(navigator.userAgent);
}

// ===================== 3. カメラ起動・ファイル選択の処理 =====================
// 3-1. 診断開始（カメラ起動）処理
startScanBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    video.srcObject = stream;
    video.style.display = "block";
    captureBtn.style.display = "inline-block";
    fileInput.style.display = "inline-block";
    startScanBtn.style.display = "none";
    await video.play();
  } catch (err) {
    alert("カメラのアクセスが許可されていません。設定を確認してください。");
    console.error("カメラ起動エラー:", err);
  }
});

// 3-2. 撮影処理（カメラ映像から画像をキャプチャ）
captureBtn.addEventListener('click', () => {
  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  currentImageData = canvas.toDataURL('image/jpeg', 0.7);
  preview.src = currentImageData;
  preview.style.display = "block";
  
  mode = "capture";
  video.style.display = "none";
  captureBtn.style.display = "none";
  fileInput.style.display = "none";
  analyzeBtn.style.display = "block";
  reCaptureBtn.style.display = "inline-block";
});

// 3-3. ファイル選択処理（画像参照）
fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      currentImageData = e.target.result;
      preview.src = currentImageData;
      preview.style.display = "block";
      
      mode = "file";
      video.style.display = "none";
      captureBtn.style.display = "none";
      fileInput.style.display = "none";
      analyzeBtn.style.display = "block";
      selectAgainBtn.style.display = "inline-block";
      takePhotoBtn.style.display = "inline-block";
    };
    reader.readAsDataURL(file);
  }
});

// ===================== 4. 診断実行（API 呼び出し） =====================
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
    currentResult = result.result;
    displayResultImage(currentResult);
    analyzeBtn.style.display = "none";
    shareBtn.style.display = "block";
    twitterBtn.style.display = "inline-block";
    lineBtn.style.display = "inline-block";
    retryBtn.style.display = "block";
    reCaptureBtn.style.display = "none";
    selectAgainBtn.style.display = "none";
    takePhotoBtn.style.display = "none";
  })
  .catch(error => {
    console.error('エラー発生:', error);
    alert("診断に失敗しました。");
  });
});

// ===================== 5. 診断結果の画像化・表示 =====================
function displayResultImage(resultText) {
  const resultCanvas = document.createElement('canvas');
  const ctx = resultCanvas.getContext('2d');
  resultCanvas.width = 500;
  resultCanvas.height = 300;
  
  // 背景描画
  ctx.fillStyle = "#f9f9f9";
  ctx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
  
  // タイトル描画
  ctx.fillStyle = "#333";
  ctx.font = "20px Arial";
  ctx.fillText("【診断結果】", 20, 40);
  
  // 診断結果テキストを改行ごとに描画
  let y = 80;
  resultText.split("\n").forEach(line => {
    ctx.fillText(line, 20, y);
    y += 30;
  });
  
  const resultImageData = resultCanvas.toDataURL('image/png');
  preview.src = resultImageData;
  preview.style.display = "block";
}

// ===================== 6. 各種再操作ボタンの処理 =====================
// 撮影モードの場合：再撮影ボタン
reCaptureBtn.addEventListener('click', () => {
  currentImageData = "";
  currentResult = "";
  preview.src = "";
  preview.style.display = "none";
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  video.style.display = "block";
  captureBtn.style.display = "inline-block";
  analyzeBtn.style.display = "none";
  reCaptureBtn.style.display = "none";
});

// ファイル参照モードの場合：画像再選択ボタン
selectAgainBtn.addEventListener('click', () => {
  fileInput.style.display = "inline-block";
  selectAgainBtn.style.display = "none";
  takePhotoBtn.style.display = "none";
  analyzeBtn.style.display = "none";
  preview.src = "";
  preview.style.display = "none";
  currentImageData = "";
  mode = "file";
});

// ファイル参照モードから撮影モードへの切り替え用：写真を撮影するボタン
takePhotoBtn.addEventListener('click', () => {
  video.style.display = "block";
  captureBtn.style.display = "inline-block";
  fileInput.style.display = "none";
  selectAgainBtn.style.display = "none";
  takePhotoBtn.style.display = "none";
  analyzeBtn.style.display = "none";
  preview.src = "";
  preview.style.display = "none";
  currentImageData = "";
  mode = "capture";
});

// 「もう一回診断する」ボタン
retryBtn.addEventListener('click', () => {
  resetToInitial();
});

// ===================== 7. シェア/保存用処理（デバイス別対応） =====================
if (isMobile()) {
  // モバイルの場合、結果表示エリアに案内テキストを表示
  const container = document.querySelector('.container');
  const mobileMsg = document.createElement('p');
  mobileMsg.textContent = "画像を長押しで保存";
  mobileMsg.style.fontSize = "16px";
  mobileMsg.style.color = "#333";
  mobileMsg.style.textAlign = "center";
  mobileMsg.style.marginTop = "20px";
  container.appendChild(mobileMsg);
} else {
  // PCの場合、shareBtn に診断結果画像の生成＆ダウンロード処理を設定
  shareBtn.addEventListener('click', () => {
    const shareCanvas = document.createElement('canvas');
    shareCanvas.width = 500;
    shareCanvas.height = 300;
    const ctx = shareCanvas.getContext('2d');
    
    ctx.fillStyle = "#f9f9f9";
    ctx.fillRect(0, 0, shareCanvas.width, shareCanvas.height);
    
    ctx.fillStyle = "#333";
    ctx.font = "20px Arial";
    ctx.fillText("Face Scan Result", 20, 40);
    
    let y = 80;
    currentResult.split('\n').forEach(line => {
      ctx.fillText(line, 20, y);
      y += 30;
    });
    
    const dataUrl = shareCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = "face_scan_result.png";
    a.click();
  });
}
