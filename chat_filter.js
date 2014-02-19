/* 
 * chat_filter.js
 *
 * Feel free to review/compress it yourself; good internet security is important!
 * Compressed by UglifyJS.
 * Passes http://www.jshint.com on default settings
 * Contributors:
 *     /u/RenaKunisaki
 *     /u/smog_alado 
 *     /u/SRS-SRSLY
 *     /u/schrobby
 *     /u/red_agent
 *     /u/DeathlyDeep
 *     /u/jeff_gohlke
 */


// ==UserScript==
// @name        Twitch Plays Pokemon Chat Filter
// @namespace   https://github.com/jpgohlke/twitch-chat-filter
// @description Hide input commands from the chat.
// @include     http://www.twitch.tv/twitchplayspokemon
// @version     1

// @grant       unsafeWindow
// ==/UserScript==

//TODO: add metadata for update link.


/* global unsafeWindow:false */


(function(){
"use strict";


// --- Script configuration ---

var BLOCKED_WORDS = [
    //Standard Commands
    "left", "right", "up", "down", "start", "select", "a", "b", "democracy", "anarchy",                                                
    //Common misspellings
    "upu", "uo", "pu", "uup", "uip", "ip",
    "dwon", "donw", "dowm", "dow", "dowqn", "doiwn", "diwn", "ldown", "donwn", "odwn", "downm", "dpwn", "downw", "downd", "dowj",
    "lef", "lfet", "lefft", "letf", "leftr", "leftrt", "leftl", "lwft",
    "riight", "rightr", "roght", "righ", "ight", "righr", "rigt",
    "anrachy", "anrchy", "anarch", "amarchy",
    "democrazy", "demarchy", "demcracy", "democarcy", "democrasy", "democacy", "demoocracy", "democary",
    //Other spam.
    "oligarchy", "bureaucracy", "monarchy", "alt f4"
];

var MINIMUM_MESSAGE_LENGTH = 3; //For Kappas and other short messages.
var MAXIMUM_NON_ASCII_CHARACTERS = 2; //For donger smilies, etc
var REFRESH_MILLISECONDS = 100;

// --- Greasemonkey loading ---

//Greasemonkey userscripts run in a separate environment and cannot use
//global variables from the page directly. We needd to access them via unsafeWindow
var myWindow;
try{
    myWindow = unsafeWindow;
}catch(e){
    myWindow = window;
}

var $ = myWindow.jQuery;
    
// --- Filtering ---

//This regex recognizes messages that contain exactly a chat command,
//without any extra words around. This includes compound democracy mode
//commands like `up2left4` and `start9`.
// (remember to escape the backslashes when building a regexes from strings!)
var commands_regex = new RegExp("^((" + BLOCKED_WORDS.join("|") + ")\\d?)+$", "i");

var message_is_spam = function(msg){
    //Ignore spaces
    msg = msg.replace(/\s/g, '');

    if(msg.length < MINIMUM_MESSAGE_LENGTH) return true;

    if(msg.match(commands_regex)) return true;

    var nonASCII = 0;
    for(var i = 0; i < msg.length; i++) {
        if(msg.charCodeAt(i) > 127) {
            nonASCII++;
            if(nonASCII > MAXIMUM_NON_ASCII_CHARACTERS){
                return true;
            }
        }
    }

    return false;
};

// --- UI ---

var initialize_ui = function(){

    $(
        "<style type='text/css' >" +
            ".segmented_tabs li li a.CommandsToggle {" +
                "width: 50px;" +
                "padding-left: 0px;" +
                "padding-top: 0;" +
                "height: 8px;" +
                "line-height: 115%;" +
            "}" +
    
            ".segmented_tabs li li a.ChatToggle {" +
                "width: 35px;" +
                "padding-left: 15px;" +
                "padding-top: 0;" +
                "height: 8px;" +
                "line-height: 115%;" +
            "}" +
    
            "#chat_line_list li { display:none }" + // hide new, uncategorized messages
    
            "#chat_line_list li.fromjtv,"         + // show twitch error messages
            "#chat_line_list.showSpam li.cSpam,"  + // show commands if they toggled on
            "#chat_line_list.showSafe li.cSafe {" + // show non-commands if they are enabled
                "display:inherit;" +
            "}" +
        " </style>"
    ).appendTo("head");
    
    
    // Reduce the width of the chat button to fit the extra buttons we will add.
    var chat_button = $("ul.segmented_tabs li a").first();
    chat_button.css("width", chat_button.width() - 71);
    
    // Add a pair of buttons to toggle the spam on and off.
    $("<li><a class='CommandsToggle'>Commands</a><a class='ChatToggle'>Talk</a></li>").insertAfter(chat_button);
    
    $(".CommandsToggle").click(function () {
        $(this).toggleClass("selected");
        $("#chat_line_list").toggleClass("showSpam");
    });
    
    $(".ChatToggle").click(function () {
        $(this).toggleClass("selected");
        $("#chat_line_list").toggleClass("showSafe");
    });
    
    // Simulate a click on ChatToggle so it starts in the "on" position.
    $(".ChatToggle").click();
};

// --- Main ---

var initialize_filter = function(){

    setInterval(function () {
        
        //Check if the chat has already loaded
        if(!myWindow.CurrentChat){ return; }
        
        $('#chat_line_list li:not(.cSpam):not(.cSafe)').each(function() {
            var chatLine = $(this);
            var chatText = chatLine.find(".chat_line").text();
            
            if(message_is_spam(chatText)){
              chatLine.addClass("cSpam");
            }else{
              chatLine.addClass("cSafe");
            }
        });
        
        
        //The spam commands still push chat messages out the queue so we 
        //increase the buffer size from the default 150 so chat messages
        //last a bit longer.
        myWindow.CurrentChat.line_buffer = 800;
        
        //Scroll chat appropriately (TODO: WHAT DOES APPROPRIATELY MEAN?)
        if (myWindow.CurrentChat.currently_scrolling) { 
            myWindow.CurrentChat.scroll_chat();
        }
    
    }, REFRESH_MILLISECONDS);
    
};

$(function(){
    initialize_ui();
    initialize_filter();
});
    
}());
