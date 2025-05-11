# Cloudeco-sim

May 10 2025

Continuing to explore agent / object based simulations of ecosystems:

# Ongoing

- bamboo themselves should use a shader

- there's a very general need for spatial query support
	for example plotting bamboo cluster placement
	each bamboo could be added 'for real'
	and then query support could help avoid collisions

	if volume is delivering spatial query support
	then the question is more how to get a handle on volume
	or how to talk to volume, as in how to pass a query to it
	sys can return results in my new approach
	so one could await a sys.resolve({query})

	or i could let you get a handle on something in some other way
	i could have a method that lets you get a handler out of sys
	this does destroy actor isolation 


- there's an idea of everything routing all inputs and outputs clearly
	right now things just call other things effectively; posting messages
	it might be nice to send all outs to a single function or functions
	and then things could have many outs
	rather than burying their outs inside their code
	and then i could lego things together a bit easier

	- i need to support getting terrain elevation

	- i need a bamboo shader renderer

	- more randomness on bamboo


- fix up time and tick stuff -> i turned it back on in sys
- must switch all to use new sys and that means testing everything with it

