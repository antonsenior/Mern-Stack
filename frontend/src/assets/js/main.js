(function ($) {
	"use strict";

    jQuery(document).ready(function($){

        $('.mobile-bar').on('click', function(){
            $('.sidebar, .overlay').toggleClass('active');
        })
        $('.overlay').on('click', function(){
            $('.sidebar, .overlay').removeClass('active');
        })


        // Function For Popup
        function popup(openBtn, popContent, closeBtn){
            if(document.querySelector(openBtn) !== null) {

                // Getting DOM Elements
                let openButton = document.querySelector(openBtn),
                    popupContent = document.querySelector(popContent),
                    closeButton = document.querySelector(closeBtn),
                    body = document.querySelector('body');

                // Popup Open
                openButton.addEventListener('click', ()=> {
                    popupContent.classList.add('show');
                    body.classList.add('fixed-overlay');
                })

                // Popup Close
                closeButton.addEventListener('click', ()=> {
                    popupContent.classList.remove('show');
                    body.classList.remove('fixed-overlay');
                })



            }
        }



    // Popup For Custom Goal
    popup('#get-started', '#custom-goal', '.cls-popup');
    popup('#deploy-stack', '#deploy-stack-pop', '.cls-popup');
    popup('#passForget', '#forgetpass', '.forget-cls-popup');




     // Toggle button Query
     document.querySelectorAll('.toggle-btn .toggle-outer').forEach(function(each){
        each.addEventListener('click',function(){
            this.classList.toggle('active');
        });
    });







        $(".embed-responsive iframe").addClass("embed-responsive-item");
        $(".carousel-inner .item:first-child").addClass("active");

        $('[data-toggle="tooltip"]').tooltip();


            $('#mobile-menu-active').meanmenu({
                meanScreenWidth: "767",
                meanMenuContainer: '.menu-prepent',
             });



        $('.menu-open').click( function (){

                $('.body-left-bar').toggleClass('activee');
                $('.menu-open').toggleClass('toggle');

        });

       $('select').niceSelect();

        $(".single-slider-item").owlCarousel({
            items:5,
            nav:true,
            dot:true,
            loop:true,
            margin:20,
            autoplay:false,
            autoplayTimeout:3000,
            smartSpeed:1000,
            responsiveClass:true,
            responsive:{
                0:{
                    items:2,

                },
                768:{
                    items:4,

                },
                1000:{
                    items:5,

                }
            }


        });




    });


    jQuery(window).load(function(){


    });


}(jQuery));
