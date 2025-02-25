const video = document.getElementById('video');
const captureBtn = document.getElementById('capture');
const analyzeBtn = document.getElementById('analyze');
const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('canvas');
const preview = document.getElementById('preview');

let currentImageData = ''; // 選択中の画像データを保持

// カメラ起動
async function startCamera() {
    try {
      const constraints = {
        video: {
          facingMode: { exact: "user" } // インカメラを強制
        }
      };
  
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
  
      // 📌 ここが重要（HTMLに書いてても、JS側でも設定しないと機能しない場合あり）
      video.setAttribute("autoplay", true);
      video.setAttribute("playsinline", true);
      video.setAttribute("muted", true); // iOS/Safari対策
  
      await video.play();
    } catch (err) {
      console.warn("インカメラ強制が失敗:", err);
  
      // フォールバック
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        video.srcObject = fallbackStream;
        video.setAttribute("autoplay", true);
        video.setAttribute("playsinline", true);
        video.setAttribute("muted", true);
        await video.play();
      } catch (fallbackErr) {
        console.error("カメラ起動完全に失敗:", fallbackErr);
        alert("カメラのアクセスを許可してください！");
      }
    }
  }
  
  // 📌 `DOMContentLoaded` ではなく、明示的にボタン押下時に起動
  document.getElementById("capture").addEventListener("click", startCamera);
  

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

// 診断処理
analyzeBtn.addEventListener('click', () => {
  if(!currentImageData) {
    alert("画像を撮影または参照してください！");
    return;
  }

  fetch('https://facescan-api.onrender.com/api/upload', {
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



// 画像生成

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
  ctx.fillStyle = "#f9f9f9"; // 背景色
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

// 診断結果を保存するための変数
let currentResult = "";

// 診断ボタンの処理を修正
analyzeBtn.addEventListener('click', () => {
  if (!currentImageData) {
    alert("画像を撮影または参照してください！");
    return;
  }

  fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({image: currentImageData})
  })
  .then(response => response.json())
  .then(result => {
    console.log('サーバーからのレスポンス:', result);
    alert(result.result);
    currentResult = result.result; // 診断結果を保存
  })
  .catch(error => {
    console.error('エラー発生:', error);
  });
});


// シェアボタンの作成
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
