var validWords=[];
var letters = "";
var discoveredWords =[];
var totalScore = 0;
var pangram = "";
var centerLetter = "";



//makes http request to an awi api endpoint that triggers a lambda function to return today's letters/words
//today's words and letters are generated by a lambda function from the valid_words.json dictionary 
function get_valid_words(){

    const url='https://uxxjtb4jz0.execute-api.us-east-1.amazonaws.com/default/FindValidWords';

    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.setRequestHeader("Content-type", "text/plain");
    request.onreadystatechange = function(){
      try {
        var data = JSON.parse(this.response);
        //3 is LOADING, 4 is DONE
        if(request.readyState == 3 && request.status == 200){
          console.log(data)
          letters = data['letters'];
          validWords = data['possible_words'];
          pangram = data['pangram'];
          initialize_letters();
        }
      } 
      catch (e){
        console.log('error')
      };
    };
    request.send();
}

//Creates the hexagon grid of 7 letters with middle letter as special color
function initialize_letters(){
    
    var hexgrid = document.getElementById('hexGrid')
    for(var i=0; i<letters.length; i++){
        var char = letters[i];
        
        var pElement = document.createElement("P");
        pElement.innerHTML = char;
        
        var aElement = document.createElement("A");
        aElement.className = "hexLink";
        aElement.href = "#";
        aElement.appendChild(pElement);
        aElement.addEventListener('click', clickLetter(char), false);

        var divElement = document.createElement('DIV');
        divElement.className = "hexIn"; 
        divElement.appendChild(aElement);
        
        var hexElement = document.createElement("LI");
        hexElement.className = "hex";
        hexElement.appendChild(divElement);
        if(i==3){
          aElement.id = "center-letter";
          centerLetter = letters[i];
        }
        hexgrid.appendChild(hexElement);
    }
}

Array.prototype.shuffle = function() {
  let input = this;
  for (let i = input.length-1; i >=0; i--) {
    let randomIndex = Math.floor(Math.random()*(i+1)); 
    let itemAtIndex = input[randomIndex]; 
    input[randomIndex] = input[i]; 
    input[i] = itemAtIndex;
  }
  return input;
}

function shuffleLetters() {
    letters.shuffle()
    //get center letter back to letter[3]
    var centerIndex = letters.indexOf(centerLetter);
    if(letters[3] != centerLetter) {
        var temp = letters[3];
        letters[3] = centerLetter;
        letters[centerIndex] = temp;
    }
    var hexgrid = document.getElementById('hexGrid')
    while (hexgrid.firstChild) {
      hexgrid.removeChild(hexgrid.firstChild);
    }
    initialize_letters()

    /*
    //fill in shuffled letters into hex grid 
    for(var i=0; i<letters.length; i++) {
        var char = letters[i];
        var hexLetterElement = document.getElementsByClassName("hexLink");
        hexLetterElement[i].removeChild(hexLetterElement[i].firstChild);

        var pElement = document.createElement("P");
        pElement.innerHTML = char;
        hexLetterElement[i].appendChild(pElement); 
    }*/
}

//Validate whether letter typed into input box was from one of 7 available letters
// document.getElementById("testword").addEventListener("keydown", function(event){
//     if(!letters.includes(event.key.toUpperCase())){
//         alert('Invalid Letter Typed')
//         event.preventDefault();
//     }
//   }
//   )

//When letter is clicked add it to input box
var clickLetter = function(letter){
  return function curried_func(e){
    var tryword = document.getElementById("testword");
    tryword.value = tryword.value + letter.toLowerCase();
  }
}

//Deletes the last letter of the string in the textbox
function deleteLetter(){
  var tryword = document.getElementById("testword");
  var trywordTrimmed = tryword.value.substring(0, tryword.value.length-1);
  tryword.value = trywordTrimmed;
  if(!checkIncorrectLetters(tryword.value)) {
      tryword.style.color = 'black';
  }
}


function notify(){


}

function shakeInput(){
  $("#testword").effect("shake", {times:10}, 1000);
}
//check if the word is valid and clear the input box
//word must be at least 4 letters
//word must contain center letter
//word can't already be found 
function submitWord(){
  var tryword = document.getElementById('testword');
  var centerLetter = document.getElementById('center-letter').firstChild.innerHTML;

  let score = 0;
  var isPangram = new Boolean(false);
  var showScore = document.getElementById("totalScore");


  if(tryword.value.length < 4){ 
    $("#too-short").fadeIn(1000);
    $("#too-short").fadeOut(500);
    shakeInput();
  }else if(discoveredWords.includes(tryword.value.toLowerCase())){
    $("#already-found").fadeIn(1000);
    $("#already-found").fadeOut(500);
    shakeInput();
  }else if(!tryword.value.toLowerCase().includes(centerLetter.toLowerCase())){
    $("#miss-center").fadeIn(1000);
    $("#miss-center").fadeOut(500);
    shakeInput();
  }else if(validWords.includes(tryword.value.toLowerCase())){
    isPangram = checkPangram(tryword);
    addToTotalScore(calculateWordScore(tryword, isPangram));
    showScore.innerHTML = totalScore;
    showDiscoveredWord(tryword);
    discoveredWords.push(tryword.value.toLowerCase());
    $("#good").fadeIn(1000);
    $("#good").fadeOut(500);
  }else{
    $("#invalid-word").fadeIn(1000);
    $("#invalid-word").fadeOut(500);
    shakeInput();
  }
  shakeInput();
  tryword.value = '';
}

//if word was valid, display it 
//if all words are found end game.
function showDiscoveredWord(input){
    var discWords = document.getElementById("discoveredWords");

    var numChildren = discWords.childElementCount; 
    if (numChildren == validWords.length){
      alert("You have found all of the possible words! Thanks for playing");
    } else{
      var listword = document.createElement("LI");
      var pword = document.createElement("P");
      pword.innerHTML = input.value; 
      listword.appendChild(pword);
      discWords.appendChild(listword);
    }
    
}

//adds input "score" to the total score of user
function addToTotalScore(score) {
  totalScore += score;
}

//calculates the score of input "input" and also adjusts if "input" is a pangram 
function calculateWordScore(input, isPangram) {
  let len = input.value.length;
  let returnScore = 1; 
  if(len > 4) {
    returnScore = len;
  }
  if(isPangram) {
    returnScore = len + 7;
  }
  return returnScore;
}

//checks if "input" word is a pangram
function checkPangram(input) {
  
  var i;
  var containsCount = 0;
  var containsAllLetters = new Boolean(false);
  for(i = 0; i < 7; i++) {
    if(input.value.includes(letters[i])) {
      containsCount++;
    }
  }
  if(containsCount == 7) {
    containsAllLetters = new Boolean(true);
  }
  console.log("isPangram?: " + containsAllLetters);
  return containsAllLetters;
  
  // console.log(input.value);
  // if(input==pangram){
  //  return true;
  // }
 return false;
}

function checkIncorrectLetters(input) {
  var i;
  var badLetterCount = 0;
  for(i = 0; i < input.length; i++) {
    if(!letters.includes(input[i])) {
      badLetterCount++;
    }
  }
  if(badLetterCount > 0) {
    return true;
  }
  return false;
}

//takes keyboard event from user and determines what should be done
function input_from_keyboard(event) {
  var tryword = document.getElementById("testword");

  if(event.keyCode == 13) {
    submitWord();
  }

  if(event.keyCode == 8) {
    deleteLetter();
  }

  //validation for just alphabet letters input
  if(event.keyCode >= 97 && event.keyCode <= 122 ||
    event.keyCode >=65 && event.keyCode <=90) {
    tryword.value = tryword.value + String.fromCharCode(event.keyCode).toLowerCase();
    if(checkIncorrectLetters(tryword.value)) {
      tryword.style.color = 'grey';
    }
  }
}