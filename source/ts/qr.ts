// QRCode.toCanvas(document.getElementById('qr'), {
// 	text: `https://metamask.app.link/dapp/${window.location.href.replace(window.location.protocol + '//', '')}`,
// 	width: 128,
// 	height: 128,
// 	colorDark : "#5868bf",
// 	colorLight : "#ffffff"
// })

// anime({
//     targets: '.lines path',
//     strokeDashoffset: [anime.setDashoffset, 0],
//     easing: 'easeInOutSine',
//     duration: 1500,
//     delay: function(el, i) { return i * 250 },
//     direction: 'alternate',
//     loop: true
// });




// QRCode.toCanvas(`https://metamask.app.link/dapp/${window.location.href.replace(window.location.protocol + '//', '')}`, {
//     errorCorrectionLevel: 'H',
//     width: document.getElementById('qr').offsetWidth,
//     height: document.getElementById('qr').offsetHeight,
//     margin: 0,
//     scale: 0,
//     color: {
//         dark:"#34448D",
//         light:"#FFFFFFFF"
//     }
// }, function (err, canvas) {
//     if (err) throw err
  
//     var container = document.getElementById('qr')
//     container.appendChild(canvas)
// })