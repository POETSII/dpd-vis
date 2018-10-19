all: ./node_modules 

./node_modules:
	npm install express
	npm install ws

clean:
	rm -rf ./node_modules 
	rm -rf package-lock.json
