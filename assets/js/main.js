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
        headerHeight = $("header").length ? $("header").height() : 0,
        footerHeight = $("footer").length ? $("footer").height() : 0,
        heightDocument = headerHeight + ($(".content").outerHeight() || 0) + footerHeight - 90;

    // Defining the size of the element to animate
    $("#scroll-animate, #scroll-animate-main").css({ height: heightDocument + "px" });

    // Defining the size of header and content elements
    if ($("header").length) {
        $("header").css({ height: headerHeight + "px" });
    }
    // Only set parallax margin-top dynamically if there is a header. 
    // Otherwise let CSS handle it (e.g. for top-aligned boards).
    if (headerHeight > 0) {
        $(".wrapper-parallax").css({ "margin-top": (headerHeight - 1) + "px" });
    }

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

    // Email Copy to Clipboard Logic
    $('.email-copy').on('click', function (e) {
        e.preventDefault();
        const email = $(this).data('email');

        navigator.clipboard.writeText(email).then(() => {
            const $tooltip = $(this).find('.copy-tooltip');
            $tooltip.addClass('show');

            // Hide tooltip after 2 seconds
            setTimeout(() => {
                $tooltip.removeClass('show');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    });
});
