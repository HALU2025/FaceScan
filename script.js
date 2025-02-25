const video = document.getElementById('video');
const captureBtn = document.getElementById('capture');
const analyzeBtn = document.getElementById('analyze');
const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('canvas');
const preview = document.getElementById('preview');

let currentImageData = ''; // 選択中の画像データを保持

// **✅ ページ読み込み時にカメラ起動**
async function startCamera() {
    try {
      const constraints = {
        video: {
          facingMode: "user" // インカメラ指定（exact を削除）
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;

      // **✅ playsinline を確実に適用**
      video.setAttribute("autoplay", true);
      video.setAttribute("playsinline", true);
      video.setAttribute("muted", true); // iOS/Safari対策

      await video.play();
    } catch (err) {
      console.error("カメラ起動失敗:", err);
      alert("カメラの起動に失敗しました: " + err.message);
    }
}

// **✅ `DOMContentLoaded` でカメラを自動起動**
document.addEventListener("DOMContentLoaded", startCamera);

// 撮影処理
captureBtn.addEventListener('click', () => {
  const ctx = canvas.getContext('2d');
  const targetWidth = 300;
  const aspectRatio = video.videoHeight / video.videoWidth;
  const targetHeight = targetWidth * aspectRatio;
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
  currentImageData = canvas.toDataURL('image/jpeg', 0.7);
  preview.src = currentImageData;
});

// ファイル選択処理
fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if(file){
    const reader = new FileReader();
    reader.onload = function(e){
      currentImageData = e.target.result;
      preview.src = currentImageData;
    };
    reader.readAsDataURL(file);
  }
});

// **✅ 診断処理の API URLを修正**
analyzeBtn.addEventListener('click', () => {
  if(!currentImageData) {
    alert("画像を撮影または参照してください！");
    return;
  }

  fetch('https://facescan-api.onrender.com/api/upload', { // ← 修正
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({image: currentImageData})
  })
  .then(response => response.json())
  .then(result => {
    console.log('サーバーからのレスポンス:', result);
    alert(result.result); // とりあえずアラートで表示
  })
  .catch(error => {
    console.error('エラー発生:', error);
  });
});
