import re 
import random
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
      
gameEngine = connect4GameEngine(6,7)


class randomPlayer():
  def __init__(self,who):
    self.who=who
    pass
  def move(self,engine):
    options=engine.enumerateMoves()
    option=random.randint(0,len(options)-1)
    engine.play(options[option],self.who)

class learningPlayer():
  def __init__(self,who,nGames):
    self.who=who
    self.stateSpace={} # dictionary so we can index it by statestring quickly
    self.explorationFactor=1.0
    self.alpha=1.0
    self.discount=0.95
    self.terminalStateCache=[]
    self.terminalStateCount=100
    self.terminalStateSum=0
    self.explorationDiscount=0.01 **(1/nGames)
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
    winState=int(engine.checkWin());
    reward = winState
    if reward!=0:
      self.explorationFactor=self.explorationFactor*self.explorationDiscount
      if (reward == self.who):
        reward=1;
      elif reward==-1:
        # tie
        reward = -1
      else:
        reward = -1
    
    # create our own state space so we can update the previous state space
    newState = engine.serialiseBoard()
    
    # Terminal state confidence counter
    if winState!=0:
      if newState not in self.stateSpace:
        self.terminalStateCache.append(0)
      else:
        self.terminalStateCache.append(1)
        self.terminalStateSum+=1
      if len(self.terminalStateCache)>self.terminalStateCount:
        self.terminalStateSum-=self.terminalStateCache[0]
        self.terminalStateCache.pop(0)

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

num_trials=1000000

players=[randomPlayer(1),learningPlayer(2,num_trials)]
winCountBuffer=100
winBuffer=[]
turn=0

for i in range(num_trials):
  while (int(gameEngine.checkWin())==0):
    players[turn].move(gameEngine)
    turn=turn+1
    if turn>=len(players):
      turn=0
  

  
  # update win loss ratio
  winBuffer.append(int(gameEngine.checkWin()))
  if (len(winBuffer)>winCountBuffer):
    winBuffer.pop(0);
  winCount=[0,0];
  for j in winBuffer:
    if j >=1:
      winCount[j-1]+=1
  if sum(winCount)>0 and i%10000==9999: # only print every 1000 games
    print ("game "+str(i))
    print("win-loss ratios:")
    print(",".join([str(w/sum(winCount)) for w in winCount]))
    print("states explored:",len(players[1].stateSpace))
    print ("win loss count:",winCount)
    print("exploration factor:",players[1].explorationFactor)
    print("terminal state confidence:",players[1].terminalStateSum/100)
    print("final board state:")
    print(gameEngine.prettyPrintBoard())
    print(str(gameEngine.checkWin()) + " won.")
    
  gameEngine.reset()
   

