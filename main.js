
// TODO LIST ///////////

///// PARAMS
var num_words = 3; // note: can't exceed the actual number of available words (in words.j)
var use_wordnik_api = false; // can pull words & defs from a website OR use a local list (words.js)

///// URLS
var api_key = "a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5";
var get_words_url = "http://api.wordnik.com:80/v4/words.json/randomWords?hasDictionaryDef=true&includePartOfSpeech=noun,adjective,verb,adverb&minCorpusCount=0&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=8&maxLength=-1&limit=" + num_words + "&api_key=" + api_key;    
var get_defns_url_head = "http://api.wordnik.com:80/v4/word.json/";
var get_defns_url_tail = "/definitions?limit=1&includeRelated=true&useCanonical=false&includeTags=false&api_key=" + api_key;
var get_wotd_url_head = "http://api.wordnik.com:80/v4/words.json/wordOfTheDay?date=";
var get_wotd_url_tail = "&api_key=" + api_key;
          
///// OBJS / global vars
var words = [];
var words_flattened = [];
var num_selected = 0;
var current_selection = [];

// build colors
var bg_colors = [];
var border_colors = [];
var bg_images = [];

var default_bg_color = "rgb(255,255,255)";
var error_bg_color = "rgb(255,200,200)";

var matches = 0;
var active = true;
var timer = 0;
var intervalId;

///// ENTRY POINT (run on page load)
function Main(){

    GenerateColors(num_words);

    // get patterns...
    $.getJSON(
        "https://www.colourlovers.com/api/patterns/top?jsonCallback=?",
        {numResults: num_words, resultOffset: RandRange(0,100)},
        function (patterns) {
            for (var i = 0; i < num_words; i++){
                bg_images.push(patterns[i].imageUrl);
            }
        }
    );

   GetWords(num_words); // will call "DrawGrid" when words are ready

   intervalId = setInterval(RunTimer, 1000);
}

function RunTimer(){
    timer++;
    $("#timer").html(timer);
}


function GenerateColors(num_words){ // gen colors (to be used to make matches more obvious)
    for (var i = 0; i < num_words; i++){  
        var saturation = 0.6;
        var hue = next() + 0.1;
        var this_bg_color = {h: hue, s: saturation, v: 0.6};
        bg_colors.push(ConvertColor(this_bg_color,0.8));
        var this_border_color = {h: hue, s: saturation, v: 0.4};
        border_colors.push(ConvertColor(this_border_color,1));
    }
}

function GetWords(){
    if (use_wordnik_api){ // get words from wordnik api
        for (var i = 0; i < num_words; i++){

            var year = RandRange(2010,2014);
            var month = RandRange(1,12);
            var day = RandRange(1,28);
            var date = year + "-" + month + "-" + day;

            $.getJSON(get_wotd_url_head + date + get_wotd_url_tail, function(d) {
                var this_word = {word: d.word, def: d.definitions[0].text};
                words.push(this_word);
                words_flattened.push(d.word);
                words_flattened.push(d.definitions[0].text);
                if (words.length == num_words) DrawGrid();
            }); 
        }
    } else { // get words from provided list (words.js)
        for (var i = 0; i < num_words; i++){
            words[i] = sat_words[i]; 
            words_flattened.push(sat_words[i].word);
            words_flattened.push(sat_words[i].def);
        }
        DrawGrid();
    }  
}

function DrawGrid(){

    tile_order = [];
     // shuffle order
    for (var i = 0; i < num_words*2; i++){
         tile_order.push(i);
    }
    Shuffle(tile_order);

    for (var i = 0; i < num_words*2; i++){
    
        var idx = tile_order[i];
        
        var this_id = "e" + idx;
        var $div = $("<div>", {id: this_id, class: "grid"});
        

        /// adding complicated click listener logic!
        $div.click(function(){
            if (!$(this).hasClass("complete") && active){

                // default behavior
                $(this).addClass("selected");
                num_selected++;
                current_selection.push($(this).attr('id'));
                if (num_selected == 1){
                   $('.selected').css({
                        'background-image': 'linear-gradient(to bottom,'+bg_colors[matches]+'0%,'+bg_colors[matches]+'100%), url(' +  bg_images[matches] + ')'
                    });
                    $(".selected").css('border-color', border_colors[matches]);

                // if a pair is selected
                } else if (num_selected == 2){
                    
                    // see if we have a matched pair!
                    var passes_test = false;
                    var test_set = [];
                    for (var i = 0; i < 2; i++){
                        test_set.push($("#" + current_selection[i]).html());
                    }
                    for (var i = 0; i < words.length; i++){
                        if (test_set[0] == words[i].word && test_set[1] == words[i].def){
                            passes_test = true;
                        }
                        if (test_set[1] == words[i].word && test_set[0] == words[i].def){
                             passes_test = true;
                        }
                    }

                    // logic for correct match
                    if (passes_test){

                        $('.selected').css({
                            'background-image': 'linear-gradient(to bottom,'+bg_colors[matches]+'0%,'+bg_colors[matches]+'100%), url(' +  bg_images[matches] + ')'
                        });
                        $(".selected").css('border-color', border_colors[matches]);
                        $(".selected").css('box-shadow', 'none');
                        $(".selected").addClass("complete"); 
                        $(".grid").removeClass("selected"); 
                        matches++;

                        // end game logic!
                        if (matches == num_words){
                            clearInterval(intervalId);
                            $("#timer").html("Final Time: " + timer);
                        }

                    // logic for INCORRECT match
                    } else {
                       
                        active = false;
                        $(".selected").css({
                           'background-image': 'linear-gradient(to bottom,rgba(255,0,0,0.6)0%,rgba(255,0,0,0.6)100%), url(' +  bg_images[matches] + ')',
                           'border-color': '#800'
                            }).delay(1500).queue(function(next){
                                active = true;
                                 $(".selected").css('border-color',"#999");
                                $('.selected').css({
                                'background-image': 'linear-gradient(to bottom,rgba(255,255,255,1)0%,rgba(255,255,255,1)100%), url(' +  bg_images[matches] + ')'
                            });
                             $(".grid").removeClass("selected"); 
                            next();
                        });
                    }
                    
                    num_selected = 0;
                    current_selection = [];

                }
            }
        });
        
        // adding div to DOM
        $("#grid").append($div);
        $("#" + this_id).html(words_flattened[idx]);
        $("#" + this_id).prop('title', words_flattened[idx]);

       
    }
}


///// HELPER FUNCTINOS
function ConvertColor(c,a){
    c = HSVtoRGB(c.h, c.s, c.v);
    c = COLORtoSTRING(c,a);
    return c;
}

function RandRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function Shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex ;
    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function COLORtoSTRING(c,a){
    ret = 'rgba(';
    ret += c.r;
    ret += ',';
    ret += c.g;
    ret += ',';
    ret += c.b;
    ret += ',';
    ret += a;
    ret += ')';
    return ret;
}

// initialize start and end of our linear transform (used for getting N-maximally separated values between START & END
// i.e. for visually distinct colors 
var START = 0;
var END = 0.9;
var _level = 1;
var _index = 1;
function next() {
    var pow2 = 2 << (_level - 1);
    var result = (END-START) / pow2;
    result = result * _index
    _index = (_index + 2) % pow2;
    if(_index == 1) {
        _level++;
    }
    return result;
}

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

/////// will run on pageload
$(function(){
   Main(); 
});
