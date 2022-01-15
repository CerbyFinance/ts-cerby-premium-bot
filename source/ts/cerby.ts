import anime from 'animejs/lib/anime.es.js';

var textWrapper = document.querySelector('.cerby-text');
textWrapper.innerHTML = textWrapper.textContent.replace(/\S/g, "<span class='letter'>$&</span>");

export const cerbyAnim = anime.timeline({
    autoplay: false,
    loop: false
})
  .add({
      targets: '.cerby',
      width: 220,
      easing: "easeInOutQuart",
      duration: 800,
      delay: 200
  })
  .add({
    targets: '.cerby-text .letter',
    translateY: [25,0],
    translateZ: 0,
    opacity: [0,1],
    display: ['none', 'inline-block'],
    easing: "easeOutExpo",
    duration: 1200,
    delay: (el, i) => 30 * i,
    begin: function() {
        (document.querySelector('.cerby-text') as HTMLElement).style.display = 'inline-block';
      },
  }, "-=200");