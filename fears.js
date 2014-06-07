/*
  This Program's 'Dictionary':
  SHOW: refers to the tv show or movie that is to be scanned
  KEYWORDS: refers to the kind of words that would indicate it might be scary
*/

$(document).ready(function()  {

  function object_to_array(obj) {
    var arr = [];
    for (var index in obj)  {
      arr.push(obj[index])
    }
    return arr;
  }

  /*************
   *** STATE ***
   *************/
  // default fear data
  var preset_fear_data;

  // user state
  var show_type_movie;
  var curr_keyword_list;

  /*************************
   *** INITIALIZING PAGE ***
   *************************/

  function init_preset_data() {  
    $.get('/get_preset_fear_info/', function(data) {
      preset_fear_data = data;
      populate_fear_dropdown(preset_fear_data);
    });
  }

  function populate_fear_dropdown(data) {
    preset_fear_data = object_to_array(data);
    var str = '';
    for (var i=0; i<preset_fear_data.length; i++)  {
      str = '<div class="item" data-value="'+i+'">'+preset_fear_data[i][0]+'</div>';
      console.log(str);
      $('#fear_dropdown').append(str);
    }
    $('.ui.dropdown').dropdown();
  }

  function init() {
    show_type_movie = true;
    init_preset_data();
    $('.ui.checkbox').checkbox();
    $('#tvshow_input').hide();
  }

  init();

  /*****************************
   *** DISPLAY FUNCTIONALITY ***
   *****************************/

  function populate_keyword_grid() {
    var str = "";
    $('#keyword_grid_body').html('');
    for (var i=0; i<curr_keyword_list.length; i++) {
      str += '<tr class="keyword_row" data-value="' + i + '">';
      str += '<td>' + curr_keyword_list[i] + '</td>';
      str += '<td>?</td></tr>';
      $('#keyword_grid_body').append(str);
      str = '';   
    }
  }

  function populate_keyword_grid_hits(keyword_count)  {
    var str = '';
    $('#keyword_grid_body').html('');
    for(var i=0; i<curr_keyword_list.length; i++) {
      str += '<tr class="keyword_row" data-value="' + i + '">';
      str += '<td>' + curr_keyword_list[i] + '</td>';
      str += '<td>' + keyword_count[curr_keyword_list[i]] + '</td></tr>';
      $('#keyword_grid_body').append(str);
      str = ''; 
    } 
  }

  function display_show_info(imdb_json) {
    var show_poster = imdb_json.Poster;
    var show_year = imdb_json.Year;
    var show_plot = imdb_json.Plot;
    $('#show_validation #show_poster').attr('src',show_poster);
    $('#show_validation #show_year').html('Released: ' + show_year);
    $('#show_validation #show_plot').html(show_plot);
    $('#show_validation').show();
    $('#page_title').hide();
  }

  /************************
   *** USER INTERACTION ***
   ************************/

  $('#show_type_toggle').click(function() {
    if (show_type_movie)  {
      show_type_movie = false;
      $('#show_type_label').html('TV Show');
      $('#movie_input').hide();
      $('#tvshow_input').show();
    }
    else  {
      show_type_movie = true;
      $('#show_type_label').html('Movie');
      $('#tvshow_input').hide();
      $('#movie_input').show();
    }
  });

  $('#fear_dropdown').click(function()  {
    var index = parseInt($('.item.active').attr('data-value'),10);
    curr_keyword_list = preset_fear_data[index];
    populate_keyword_grid();
  });

  $('#add_keyword_btn').click(function()  {
    // add keyword to grid + list
    var new_keyword = $('#custom_keyword_input').val();
    curr_keyword_list.push(new_keyword);
    populate_keyword_grid();
    $('#custom_keyword_input').val('');
  });

  $('#search_btn').click(function() {
    // TODO: validate the movie_name & year is valid
    if (show_type_movie)  {
      var movie_title = $('#movie_name').val();
      var movie_year = $('#movie_year').val();
      search_imdb_movie(movie_title,movie_year);    
    }
    else  {
      var tvshow_name = $('#tvshow_name').val();
      var tvshow_season = $('#tvshow_season').val();
      var tvshow_episode = $('#tvshow_episode').val();
      search_imdb_tv(tvshow_name,tvshow_season,tvshow_episode)
    }
  });

  /********************
   *** SEARCH LOGIC ***
   ********************/
  function get_imdb_JSON(title, year) {
    // TODO: invalid titles
    var http;
    // IE7+, Firefox, Chrome, Opera, Safari
    if (window.XMLHttpRequest)  {
      http = new XMLHttpRequest();
    }
    // IE6, IE5
    else  {
      http = new ActiveXObject('Microsoft.XMLHTTP');
    }

    if (year != '') {
      http.open('GET', 'http://www.omdbapi.com/?t=' + title + '&y=' + year, false);    
    }
    else  {
      http.open('GET', 'http://www.omdbapi.com/?t=' + title, false);
    }
    http.send(null);

    var omdbData = http.responseText;
    var omdbJSON = eval('(' + omdbData + ')');

    return omdbJSON;
  }

  function search_imdb_movie(movie_title,movie_year)  {
    var imdb_json = get_imdb_JSON(movie_title,movie_year);
    if (imdb_json.Response == "False")  {
      alert('Movie not found');
      return;
    }
    // validate with user that this is correct
    display_show_info(imdb_json);

    $.get('/synopsis/' + imdb_json.imdbID, function(synopsis) {
      var keyword_count = scan_synopsis(synopsis,curr_keyword_list);
      populate_keyword_grid_hits(keyword_count);
    });
  }

  function search_imdb_tv(tvshow_name,tvshow_season,tvshow_episode)  {
    var imdb_json = get_imdb_JSON(tvshow_name,'');
    if (imdb_json.Response == "False")  {
      alert('TV Series not found');
      return;
    }
    if (imdb_json.Type != 'series') {
      alert('whoops :(');
      return;
    }
    console.log('/tv/' + imdb_json.imdbID + '/' + tvshow_season);
    // first get episode id
    $.get('/tv/' + imdb_json.imdbID + '/' + tvshow_season + '/' + tvshow_episode, function(episode_id) {
      $.get('/synopsis/' + episode_id, function(synopsis) {
        var keyword_count = scan_synopsis(synopsis,curr_keyword_list);
        populate_keyword_grid_hits(keyword_count);
      });
    });
    // validate with user that this is correct
    display_show_info(imdb_json);
  }


  /**********************
   *** SCANNING LOGIC ***
   **********************/

  function init_dictionary(list, init_value)  {
    var dic = {};
    for (var i=0; i<list.length; i++)  {
      dic[list[i]] = init_value;
    }
    return dic;
  }

  function check_if_unboring_word(value,index,ar) {
    if (value.length > 3) {
      return true;
    }
    if (value == '' || value == 'the' || value == 'a' || value == 'of' || value == 'as')  {
      return false;      
    }
    if (value == 'to' || value == 'and' || value == 'it' || value == 'is' || value == 'in')  {
      return false;      
    }
    return true;
  }

  function lower_case(value,index,ar)  {
    return value.toLowerCase();
  }

  function scan_synopsis(synopsis, keywords)  {
    // return keyword_count;
    keywords = keywords.map(lower_case);
    var keyword_count = init_dictionary(keywords,0);
    synopsis_words = synopsis.split(/\W+/);
    synopsis_words = synopsis_words.filter(check_if_unboring_word);
    synopsis_words = synopsis_words.map(lower_case);
    // ^^cut down "The Fountain" from 880 to 680

    for (var i=0; i<keywords.length; i++) {
      for (var j=0; j<synopsis_words.length; j++) {
        if (keywords[i] == synopsis_words[j]) {
          keyword_count[keywords[i]] += 1;
        }
        else  {
          // looking for plurals
          if (synopsis_words[j].startsWith(keywords[i]))  {
            if (synopsis_words[j].endsWith('s') || synopsis_words[j].endsWith('es')) {
              keyword_count[keywords[i]] += 1;
            }
          }
        }
      }
    }

    return keyword_count;
  }
})

/*
  TODO:
    {x} toggle movie/tv label
    {x} toggle movie/tv input display
    {x} create grid
    {x} dynamically add fears
    {x} user add keyword
    {x} clean up duplicates/junk
    {x} given #hits, populate grid
    { } when custom fear is selected, clear previous fear from dropdown
    { } when user loads page for first time, no fear is selected
    { } add REMOVE buttons for keywords
    {x} ? maybe move default fears/keyword stuff to either python or firebase server
    { } fix bug where doing a second search
    { } if season/episode doesn't exist
    { } get rid of custom fear and say 'default' fear and just use keywords
  BIGGER TODOs:
    {x} TV shows
    { } add help w/ keywords
    { } add 'suggest keyword'
    { } add 'suggest fear'
    { } add 'show sentences w/ keyword' option
    { } give url to imdb synopsis page
    { } some kind of saving option whether locally or login
    { } loading animation while scanning page
    { } give option for simply giving imdb page
    { } search imdb instead of omdb for multiple movie results
    { } edit display_show for tv episodes
    ID FOR DIV WITH SYNOPOSIS IS 'swiki.2.1'
*/