$(document).ready(function () {
  /*$('#hero-slider-body').slick({
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    prevArrow: $('#hero-arrow-left'),
    nextArrow: $('#hero-arrow-right'),
    responsive: [
      {
        breakpoint: 649,
        settings: {
          arrows: false
          // ,
          // autoplay: true,
          // autoplaySpeed: 6000
        }
      }
    ]
  });*/


});

function showPopup(divToShow) {
  $(divToShow).removeClass('is-hidden');
}

function hidePopup(divToHide) {
  $(divToHide).addClass('is-hidden');
}

function switchToSlide(sliderID, slideNum) {
  $(sliderID).slick('slickGoTo', slideNum);
}