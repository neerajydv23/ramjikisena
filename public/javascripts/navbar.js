// var menubtn = document.querySelector(".nav-2 .right i")
// menubtn.addEventListener("click", function(){
   
//         var menupage = document.querySelector("#slidebar")
//         if (flag = 1) {
//             menupage.style.transform = "translateY(0)"
//             flag = 0
//         } 
    
// })
// var close = document.querySelector("#slidebar #close i")
// close.addEventListener("click", function () {
//     var menupage = document.querySelector("#slidebar")

//     menupage.style.transform = "translateY(-100%)"

// })

var flag = 1; // Initialize flag to 1

var menubtn = document.querySelector(".nav-2 .right i");
var menupage = document.querySelector("#slidebar");

menubtn.addEventListener("click", function() {
    if (flag === 1) {
        menupage.style.transform = "translateY(-2%)";
        flag = 0;
    } else {
        menupage.style.transform = "translateY(-200%)";
        flag = 1;
    }
});

var close = document.querySelector("#slidebar #close i");

close.addEventListener("click", function() {
    menupage.style.transform = "translateY(-200%)";
    flag = 1;
});
