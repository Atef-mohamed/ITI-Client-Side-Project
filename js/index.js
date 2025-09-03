window.onload = () => {
    gsap.from(".logo", { duration: 1, scale: 0, opacity: 0, ease: "elastic.out(1, 0.5)" });
    gsap.from("h1", { duration: 1, y: -100, opacity: 0, delay: 0.5, ease: "bounce" });
    gsap.from("h3", { duration: 1, y: 50, opacity: 0, delay: 1, ease: "power2.out" });
    gsap.from(".btn-login", { duration: 1, scale: 1, opacity: 0, delay: 1.8, ease: "elastic.out(1, 0.5)" });


};