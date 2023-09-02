let tab;
let mainLoop;
let indicator = false;
let delay = 10000;

async function init() {
	await chrome.offscreen.createDocument({
		url: 'offscreen.html',
		reasons: [chrome.offscreen.Reason.IFRAME_SCRIPTING],
		justification: 'Using eval in sandbox',
	});

	await new Promise(res => {
		chrome.tabs.query({ url: "https://florr.io/*" }, tabs => {
	  	tab = tabs[0];
			res();
		});
	});

	await chrome.debugger.attach({ tabId: tab.id }, "1.2", () => {});

	chrome.action.onClicked.addListener(() => {
		chrome.action.setIcon({
			path: './icons/' + (indicator ? 'red128.png' : 'green128.png'),
		});

		if (indicator) {
			clearInterval(mainLoop);
		} else {
			mainLoop = setTimeout(async function run() {
				await passAFKCheck();
				mainLoop = setTimeout(run, delay);
			}, delay);
		};

		indicator = !indicator;
	});
}

init();

async function passAFKCheck() {
	console.log('Hi!');

  chrome.tabs.query({ url: "https://florr.io/*" }, tabs => {
    tab = tabs[0];

	  if (tab) {
	    chrome.scripting.executeScript({
	      target: { tabId: tab.id, allFrames: true },
	      func: grabCanvas,
	    }, onResult);
	  } else {
	   	clearInterval(mainLoop);
	   	indicator = false;
	   	chrome.action.setIcon({
				path: './icons/128.png',
			});
	  }
  });

	function grabCanvas() {
		return document.querySelector('#canvas')?.toDataURL();
	}

	function onResult(canvas) {
		if (!canvas || !canvas.length) return;

		canvas.forEach(async (el) => {
			if (!el.result) return;
			const res = await chrome.runtime.sendMessage(el.result);
			
			console.log('J:', res);

			if (!res.x && !res.y) return;

			chrome.debugger.sendCommand(
  			{ tabId: tab.id }, "Input.dispatchMouseEvent",
  			{
  				type: "mousePressed",
  				x: res.x, y: res.y,
  				button: "left"
  			},
  			() => {
  				setTimeout(() => {
						chrome.debugger.sendCommand(
			  			{ tabId: tab.id }, "Input.dispatchMouseEvent",
			  			{
			  				type: "mouseReleased",
			  				x: res.x, y: res.y,
			  				button: "left"
			  			},
			  		)
					}, 100)
  			}
  		)
  	});
	}
}

// async function loadImg(buffer) {
// 		return new Promise((res, rej) => {
// 			const img = new Image();
// 			img.src = buffer;
// 			img.onload = () => res(img);
// 			img.onerror = () => rej(new Error('Could not load image'));
// 		});
// 	}

// 	function getRNG(min, max) {
// 		return Math.floor(Math.random() * (max - min + 1) + min)
// 	}

// 	window.addEventListener('message', async (ev) => {
// 		const srcImg = await loadImg('./1.png');
// 		const src = cv.imread(srcImg);
// 		const templImg = await loadImg('./templ.png')
// 		const templ = cv.imread(templImg);
		
// 		// cv.imshow('screen', templ);

// 		let dst = new cv.Mat();
// 		let mask = new cv.Mat();
// 		cv.matchTemplate(src, templ, dst, cv.TM_CCOEFF, mask);
		
// 		let result = cv.minMaxLoc(dst, mask);
// 		let maxPoint = result.maxLoc;	

// 		// let color = new cv.Scalar(255, 0, 0, 255);
// 		// let point = new cv.Point(maxPoint.x + templ.cols, maxPoint.y + templ.rows);
// 		// let point = new cv.Point(maxPoint.x+50+getRNG(-10, 10), maxPoint.y+70+getRNG(-5, 5));
// 		// cv.rectangle(src, maxPoint, point, color, 2, cv.LINE_8, 0);
// 		// cv.rectangle(src, new cv.Point(10, 10), new cv.Point(220, 100), color, 2, cv.LINE_8, 0);
		
// 		// cv.imshow('screen', src);
// 		src.delete(); dst.delete(); mask.delete();

// 		const afkResult = {
// 			x: maxPoint.x < 160 ? 0 : maxPoint.x+50+getRNG(-10, 10),
// 			y: maxPoint.y < 90  ? 0 : maxPoint.y+70+getRNG(-4, 4),
// 		}

// 		ev.source.window.postMessage(afkResult, ev.origin);
// 	});
