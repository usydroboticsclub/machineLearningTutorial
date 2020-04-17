# Machine learning for roboticists
Machine learning (and neural networks) has recieved a lot of hype over the past few years. In fact, so called AI is probably the biggest source of startups over the past three years. 

Today, we're going to look at machine learning from a slightly different point of view: the roboticist's view. The biggest difference between machine learning and neural networks (which are a form of machine learning) is that machine learning is used for control systems, whilst neural networks are used for data analysis. 

There are many different varieties of machine learning, and each occupies its own niche. Some examples I can think of are:

- Basic neural network: for sorting out items
- Recurrent neural network: for processing chains of items e.g. words
- Convolutional neural network: for processing multidimensional data e.g. pictures
- Discrete Reinforcement learning: for determining sets of actions
- Genetic algorithm: for controller refinement e.g. PID tuning
- Nonlinear system regression: for determining nonlinear models of complex systems.
- Generative adversarial networks: for creating mimics of datasets

Today, we'll go through a few examples of machine learning.

## Contents
- Reinforcement learning plays connect-4
- Genetic algorithm learns how to walk
- Neural network sorts kittens from fish




## Reinforcement learning plays connect-4
How much do you need to know to play connect-4? You need to: 
- See the board, and know where the pieces are
- For any given board position, figure out which piece to play to have the optimal play strategy. 
- Want to win.

The key thing to note here is that you, or a computer in your place, doesn't explicitly need to know how to win; if it had a map of every single state that ever existed and the best play for that step. But here we have a problem: We may be able to map out every single move for every single state, but even then, how do we assign a score to each move?

So you can follow along, let's go to https://colab.research.google.com/ . Once you're there, create a new colab workbook, and we can get started!

First, let's implement an engine for our connect 4. The engine has 4 main functions:
1. Check whether a state is a winning state
    - This is a reward. Notice that for reinforcement learning, the reward need not apply to every state.
2. Given an action, determine the next action
    - This is our system, as we might face in real life
3. Serialise the state into a discrete representation
    - For our connect 4, this is fairly easy, since the board is discrete. For real life situations, this may not be so easy. In fact, you can get a neural net to do this for you! 
4. Enumerate all possible next moves
    - This is part of our controller design. In this case, this is just based on the game moves for connect 4.
```python
import re 
# regular expressions to check whether the board is in a winning state

class connect4GameEngine():
  def __init__(self, w, h):
    self.w=w
    self.h=h
    self.reset()
    self.winRegexes=[]
    self.winRegexes.append(re.compile("([^0\\|])\\1\\1\\1")) # row win condition
    self.winRegexes.append(re.compile("([^0\\|])"+("."*w+"\\1")*3)) # column win condition
    self.winRegexes.append(re.compile("([^0\\|])"+("."*(w+1)+"\\1")*3)) # forward diagonal win condition
    self.winRegexes.append(re.compile("([^0\\|])"+("."*(w-1)+"\\1")*3)) # backward diagonal win condition
  def reset(self):
    self.board=[]
    for i in range(self.h):
      self.board.append([0]*self.w); # make a w by h board of zeros
  def serialiseBoard(self):
    return "|".join(("".join(str(cell) for cell in row)) for row in self.board)
  
  def prettyPrintBoard(self):
    return "\n".join(("|".join(str(cell) for cell in row)) for row in self.board)

  def enumerateMoves(self):
    # translate rows into columns
    validMoves=[]
    for i,col in enumerate(self.board[0]):
      if col==0:
        validMoves.append(i)
    return validMoves
  
  def play(self,column,player):
    for i in range(len(self.board)-1,-1,-1):
      if self.board[i][column]==0:
        self.board[i][column]=player
        return True
    return False
  
  def fromSerialisedString(self,serial):
    self.board=[[*row] for row in serial.split("|")]

  def checkWin(self):
    serial=self.serialiseBoard()
    for r in self.winRegexes:
      p=r.search(serial)
      if p is not None:
        return p.group(1)
    # also check if the game is a tie
    if serial.find("0")==-1:
      return -1 # a tie
    return 0
      
gameEngine = connect4GameEngine(7,6)
```
Next, lets implement two players. The first one will be a completely random player, which we will use as benchmarking.
```python
import random

class randomPlayer():
  def __init__(self,who):
    self.who=who
    pass
  def move(self,engine):
    options=engine.enumerateMoves()
    option=random.randint(0,len(options)-1)
    engine.play(options[option],self.who)
```
And with this, we can create a game controller to automatically run games:

```python
players=[randomPlayer(1),randomPlayer(2)]
turn=0

num_trials=100
for i in range(num_trials):
  while (int(gameEngine.checkWin())==0):
    players[turn].move(gameEngine)
    turn=turn+1
    if turn>=len(players):
      turn=0
  print("final board state:")
  print(gameEngine.prettyPrintBoard())
  print(str(gameEngine.checkWin()) + "won.")
  gameEngine.reset()
```

Alright, so our random players are happily playing the game now, blissfully unaware of the absolute unit that is about to take them out. Here, we start on our reinforcement learning bot!

How does the bot work?

Assume there is some state `S`, with transitions `t1, t2, t3, t4 ...` etc, which lead to `S1, S2, S3, S4 ...` respectively. Assuming we are free to make a decision at `S`, we would choose the best possible decision; so our score for state `S` is `S = max(tn)`; unless of course it is a winning or losing state, in which case its reward is 1 or -1 respectively. The reward for each transition is given as `t_n = t_n + A * (reward + D * S_n - t_n)`. `A` is a learning rate, which is typically set to 1. D is a discount rate, which roughly translates to the amount of uncertainty of you achieving `S_n` from `t_n`, and you can set this to a suitable value like 0.95. The `- t_n` term at the end I suspect allows the controller to 'forget' its previous actions so that it can learn new ones. 

A few final touches: the bot needs to make mistakes to learn, so we have an exploration factor `E` which is the chance that the bot will make a random move, instead of the best move. This typically starts as 1 and then goes down as the bot gets more experienced.

So, in python, this looks something like:
```python
class learningPlayer():
  def __init__(self,who):
    self.who=who
    self.stateSpace={} # dictionary so we can index it by statestring quickly
    self.explorationFactor=1.0
    self.alpha=1.0
    self.discount=0.95
    pass
  def move(self,engine):
    
    # Create the state space map for this state space, if it doesnt exist
    prevState = engine.serialiseBoard()
    options = engine.enumerateMoves()
    if prevState not in self.stateSpace:
      self.stateSpace[prevState]=[[0, i] for i in options] # reward and move
    
    # pick a move
    bestMove = [-100,options[0]]
    for m in self.stateSpace[prevState]:
      if m[0]>bestMove[0]:
        bestMove = m

    option = bestMove[1]
    if random.random()<self.explorationFactor:
      # make a random move
      option=options[random.randint(0,len(options)-1)]
    engine.play(option,self.who)
    
    # get the reward and update our state space
    reward = int(engine.checkWin());
    if reward!=0:
      self.explorationFactor=self.explorationFactor*0.99995
      if (reward == self.who):
        reward=1;
      elif reward==-1:
        # tie
        reward = -1
      else:
        reward = -1
    
    # create our own state space so we can update the previous state space
    newState = engine.serialiseBoard()
    options = engine.enumerateMoves()
    if newState not in self.stateSpace:
      self.stateSpace[newState]=[[0, i] for i in options] # reward and move
    if (len(self.stateSpace[newState])==0):
      # this is a terminal state; we add a winning state so that the algorithm works
      self.stateSpace[newState]=[[reward,0]];
      # also be a bit less explory since we've played a full game
    
    currentStateScore=max([i[0] for i in self.stateSpace[newState]])
    # actually update now
    for i,m in enumerate(self.stateSpace[prevState]):
      if m[1]==option:
        self.stateSpace[prevState][i][0]= self.stateSpace[prevState][i][0]+self.alpha*(reward+self.discount*currentStateScore-self.stateSpace[prevState][i][0])

```
Now, we can kick up the trials to 1000, and watch our reinforcement learning algorithm absolutely dominate the opposition. Ready?

### 1000 trials later:
Win-loss ratio (random:reinforcement-learning): 0.50,0.50

Ok, that's not much better than 50:50.
So what went wrong? Well, nothing, actually. What's the state space for this game? A rough estimate says each tile of 6x7 tiles has 3 possible states: red, yellow or empty. This gives 3^42 = 10^200 states! Our bot has only traversed 17,000 states in its 1000 runs. 

So yes, there are refinements that can be made to reinforcement learning. But after all this hard work, we want to see some results. So let's cut the field down to 4x4, and see if we perform any better over 100,000 runs.

### 100,000 trials later:
Win-loss ratio (random:reinforcement-learning): 0.31:0.68

Alright! And to prove this is not just a fluke, I've modified the win loss calculator to take an average of the last 100 games, and for the past few averages its been pretty consistent. That's a definite win... but still not really impressive. Why? A 4x4 board gives us 43 million states overall, and our bot has seen only 61,000. We can further refine the calculation of the bot's experience by counting the number of terminal states it has seen before over the last 100 games, which turned out to be 85% for this set of games. 

### 1,000,000 trials later:
Win-loss ratio: 0.35:0.65
States seen: 213,000
Terminal state confidence: 100% 

Looks ok. There's just one thing that's making me feel annoyed at this point: The last game, according to the record, was this:

2|0|0|0
2|0|0|0
2|0|0|0
1|1|1|1

WHY? 

### 1,000,000 trials later, on a 6x7 grid:
Win-loss ratio: 0.29:0.71
States seen: 5,714,939
Terminal state confidence: 88%

Last game:

0|0|0|0|0|0
0|0|0|0|0|0
0|0|0|0|0|0
2|0|0|0|0|0
2|0|0|0|0|0
2|0|0|0|0|0
2|1|0|1|1|1

Ah, the irony. Interestingly though, the win/loss rate is similar if not better than the 4x4!

If you want to play with the code, check out the `reinforcement-connect-4.py`. You can do this for a whole range of card and board games!

## Learning to walk with a genetic algorithm

This next one we are going to do in Javascript, because it has a built in renderer that is installed by default if you have chrome or safari, and because I already have code for it.

A genetic algorithm is an algorithm that uses evolution-like principles to optimise either a set of control parameters, or a controller structure, for a system. The steps for designing a genetic algorithm are here:

1. Get a system model that you can apply a control input to.
2. Create a cost/reward function that you want to mini/maximise.
3. Generate a population of random controllers, encoded by some 'dna'.
    - These can be real number parameters or even control trees.
4. Evaluate the controller population using your cost / reward function
5. Rank the current population based on performance.
6. Generate a new population by using some of the following strategies:
    1. Replication: Directly copy the best from one generation over to the other
    2. Crossover: Swap two chunks of DNA between two controllers. This is exploitative, as it helps the population move closer to a good solution by combining two solutions.
    3. Mutation: take a controller and randomly change the values. This is explorative, as it helps the population find random solutions which may be good.
7. Repeat steps 4-6 for a number of generations.

Alright, so let's implement these steps! At a high level, our code looks like this:

```javascript
var engine = new engine();

var controllerPopulation = [];
var populationSize = 20;
for (let i = 0; i < populationSize; i++) {
    controllerPopulation.push(new controller());
}

var generationCount = 10;
async function runGeneticAlgorithm() {
    for (let i = 0; i < generationCount; i++) {
        let scoredPopulation=[];
        for (let i = 0; i < controllerPopulation.length; i++) {
            scoredPopulation.push([controllerPopulation[i], await engine.evaluateController(controllerPopulation[i])]);
        }
        // scores is now a sorted list of the population and their respective scores
        scoredPopulation)=>a[0]-b[0]);
        controllerPopulation = geneticProgrammingMutate(scoredPopulation);
    }
    // Finally, we have our population!
    best = scores[0][1];
    await engine.evaluateController(best);
}
runGeneticAlgorithm();
```
Where are the parts we had earlier?
1. The system model is in `engine()`. I am using the Box2D physics engine.
2. The costFunction is in `engine.evaluateController`. If you dig a little deeper, you'll find I use `if (pos.y > 15 && pos.x>40) this.currentScore += (pos.x-40)*pos.y;`, where pos is the location of the walker's body.
3. The DNA is a control tree. I create a control tree by making a sequence of nodes, where each node has up to two child nodes. E.g. node +(node 1, node 2); or node +(node +(node 1,node y), node x). 
    - There are two types of genetic algorithm: genetic parameter tuning for when you have a known paramter structure, and genetic programming, for when you have an unknown parameter structure. I have no idea what the controller structure will look like, so let's use genetic programming.
    - Note there are x's and y's in the nodes: these are our sensor inputs.
4. Evaluate the controller population using your cost / reward function
    - This is done using our engine, using the costfunction above.
5. The `scoredPopulation.sort` line ranks the current population based on performance.
6. Generating a new population is done using the `geneticProgrammingMutate` function. I've also implemented each of the replication, crossover and mutation algorithms for my controller. 
7. We then repeat this for `generationCount`.

This took a whole day to write up; and honestly didn't produce particularly spectacular results either :(

### Results
- After 10 generations, the bots were getting remarkably good... at falling flat on their faces.
- After 30 generations, the bots can finally stand up!
- After 100 generations, a dominant generation of bots have taken over... but they're all bad, either falling forward elegantly or standing there doing nothing.
- After 1000 generations, ???

### Demo
Go clone this repository and open 'index.html' with your browser to check it out.

### Resource
This particular video was super useful for me when compiling this project: https://www.youtube.com/watch?v=CZE86BPDqCI

## Sorting cats and elephants using a neural net

The next activity we will do on a neural network competition site called kaggle, which the software engineers among you may already be familiar with. Two plusses for using kaggle over your own computer are that 1. Kaggle has huge datasets that you probably don't want to download, because there's your entire month's data allocation; and 2. Kaggle has GPUs, which you may not be able to afford.

So we're going to go here: https://www.kaggle.com/scratchpad/kernel3ebaff6211/edit

To train our neural network, we'll need to do the following things:
1. Split the data into a training set, a validation set, and an evaluation set. In this case, I'm going to do a 75/15/10 split.
2. Create a structure for the neural net. We'll be using a convolutional neural net.
    - A convolutional neural net has two operations: convolve (apply a 'filter' to a set of pixels) and pool (simplify and collect the data). Convolutions and pools both result in smaller grids of information; so say you start with a square grid of 200x200 pixels; your first convolution may reduce this to 180x180,and your next may reduce it to 160x160, and so on and so forth.
    - You can train your neural net using special formulae that progressively refine the convolutions that you apply based on the result of the neural network. This is known as backpropagation.
    - Many of these algorithms already exist! You just need to pick the right ones.
3. Train your data.
4. Results!

I used the following code on Kaggle's animals10 dataset. 

```python
from keras import layers
from keras import models


model = models.Sequential()
model.add(layers.Conv2D(32,(10,10),activation="relu",input_shape=(256, 256,3)))
model.add(layers.MaxPooling2D((2, 2)))
model.add(layers.Conv2D(64, (5, 5), activation="relu"))
model.add(layers.MaxPooling2D((4, 4)))
model.add(layers.Conv2D(8, (5, 5), activation="relu"))
model.add(layers.MaxPooling2D((4, 4)))
model.add(layers.Flatten())
model.add(layers.Dense(1, activation="softmax"))
model.summary()


# Input data files are available in the "../input/" directory.
# For example, running this (by clicking run or pressing Shift+Enter) will list all files under the input directory

import os


# Clear working directory
for dirname, _, filenames in os.walk('/kaggle/working'):
    for filename in filenames:
        os.remove(os.path.join(dirname, filename))

# make some directories
try:
    os.mkdir('/kaggle/working/train')
    os.mkdir('/kaggle/working/test')
    os.mkdir('/kaggle/working/validation')

    os.mkdir('/kaggle/working/train/elefante')
    os.mkdir('/kaggle/working/train/gatto')
    os.mkdir('/kaggle/working/test/elefante')
    os.mkdir('/kaggle/working/test/gatto')
    os.mkdir('/kaggle/working/validation/elefante')
    os.mkdir('/kaggle/working/validation/gatto')
except Exception:
    pass
        
import random
import cv2
# split out images from raw image
for dirname, _, filenames in os.walk('/kaggle/input'):
    if (dirname.find('elefante')==-1 and dirname.find('gatto')==-1):
        continue
    for filename in filenames:
        if (filename.endswith('jpeg')):
            # preprocess by resizing to size we want
            oriimg=cv2.imread(os.path.join(dirname, filename))
            img = cv2.resize(oriimg,(256,256))
            section=random.random()
            destination = ""
            if section<0.75:
                destination=os.path.join('/kaggle/working',"train",os.path.basename(dirname), filename)
            elif section<0.9:
                destination=os.path.join('/kaggle/working',"test",os.path.basename(dirname), filename)
            else:
                destination=os.path.join('/kaggle/working',"validation",os.path.basename(dirname), filename)
            cv2.imwrite(destination,img)



from keras.preprocessing.image import ImageDataGenerator

datagen = ImageDataGenerator()
train_it = datagen.flow_from_directory('/kaggle/working/train/', class_mode='binary', batch_size=64)
val_it = datagen.flow_from_directory('/kaggle/working/validation/', class_mode='binary', batch_size=64)
test_it = datagen.flow_from_directory('/kaggle/working/test/', class_mode='binary', batch_size=64)        

model.compile(loss="binary_crossentropy",
              optimizer="sgd",
              metrics=["accuracy"])


model.fit_generator(train_it, steps_per_epoch=16, validation_data=val_it, epochs=5, verbose=1, validation_steps=8)

loss = model.evaluate_generator(test_it, steps=24)

print (loss)

```
### Results
The results were... pretty nasty, to be honest. The neural net had only a 51% success rate of classifying things correctly. But that's baby steps, because it's hard to produce an algorithm that can get anywhere close to that result. Thanks to python, the non-data-processing only took a few lines! And we can quickly change the model (although training will take some time, again.)

### Resource

This resource was super helpful for me when learning to make a CNN: https://towardsdatascience.com/convolutional-neural-networks-for-beginners-practical-guide-with-python-and-keras-dc688ea90dca

I also used https://machinelearningmastery.com/how-to-load-large-datasets-from-directories-for-deep-learning-with-keras/ to help. And good ol' stackoverflow.