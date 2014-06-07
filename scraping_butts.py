import requests
from bs4 import BeautifulSoup
from bottle import route, run, static_file

@route('/synopsis/<imdb_id>')
def get_synposis(imdb_id):
	url = 'http://www.imdb.com/title/' + imdb_id + '/synopsis'
	r = requests.get(url)
	soup = BeautifulSoup(r.text)
	return soup.find_all(id='swiki.2.1')[0].get_text()

@route('/')
@route('/static/<filename:path>')
def send_static(filename='index.html'):
	return static_file(filename, root='./')


# TV Show Stuff
@route('/tv/<imdb_id>/<season_num>/<episode_num>')
def get_tv_show(imdb_id,season_num,episode_num):
	url = 'http://www.imdb.com/title/' + imdb_id + '/episodes?season=' + season_num
	r = requests.get(url)
	soup = BeautifulSoup(r.text)
	a_soup = soup.find_all('a')
	for tag in a_soup:
		if 'itemprop' in tag.attrs and tag['itemprop'] == 'url' and tag['href'].endswith('ep' + episode_num):
			return tag['href'].split('/')[2]
	return None

@route('/get_preset_fear_info/')
def get_preset_fear_info():
	print 'yolo'
	f = open('fears.txt')
	data = {}
	index = 0
	for line in f:
		keyword_list = line.strip('\n').split(',')
		data[index] = keyword_list
		index += 1
	print data
	return data

if __name__ == '__main__':
	run(host='localhost',port=6060)
	# print get_preset_fear_info()