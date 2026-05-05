function scrollFooter(scrollY, heightFooter) {
    console.log(scrollY);
    console.log(heightFooter);
    if (scrollY >= heightFooter) {
        $("footer").css({ bottom: "0px" });
    } else {
        $("footer").css({ bottom: "-" + heightFooter + "px" });
    }
}

// 1. Corrected load syntax for the main wrapper
$(window).on("load", function () {
    var windowHeight = $(window).height(),
        headerHeight = windowHeight,
        footerHeight = $("footer").height(),
        heightDocument = headerHeight + $(".content").height() + $("footer").height() - 60;

    // Defining the size of the element to animate
    $("#scroll-animate, #scroll-animate-main").css({ height: heightDocument + "px" });

    // Defining the size of header and content elements
    $("header").css({ height: headerHeight + "px" });
    $(".wrapper-parallax").css({ "margin-top": headerHeight + "px" });

    scrollFooter(window.scrollY, footerHeight);

    // when scrolling
    window.onscroll = function () {
        var scroll = window.scrollY;

        $("#scroll-animate-main").css({ top: "-" + scroll + "px" });
        $("header").css({ "background-position-y": 50 - (scroll * 100) / heightDocument + "%" });

        scrollFooter(scroll, footerHeight);

        // 2. Header text animation moved inside the scroll event!
        var newOpacity = 1 - scroll / 400;
        var moveUp = -(scroll * 0.5);
        $("header h1, header .sub-text").css({
            animation: "none" /* This forces the CSS keyframes to let go! */,
            opacity: newOpacity,
            transform: "translateY(" + moveUp + "px)"
        });
    };
});
