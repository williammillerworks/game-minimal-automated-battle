"use client"

import { useRef, useMemo } from "react"
import { useAutomatedBattle } from "@/hooks/use-automated-battle"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Dices, Volume2, VolumeX, Zap, ZapOff } from "lucide-react"

export default function AutomatedBattlePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const {
    status,
    settings,
    leaderboard,
    countdown,
    elapsedTime,
    winner,
    setSetting,
    handleNameChange,
    randomizeNames,
    startGame,
    resetGame,
  } = useAutomatedBattle(canvasRef)

  const sortedLeaderboard = useMemo(() => {
    return [...leaderboard].sort((a, b) => {
      if (a.isAlive && !b.isAlive) return -1
      if (!a.isAlive && b.isAlive) return 1
      if (a.kills !== b.kills) return b.kills - a.kills
      return 0
    })
  }, [leaderboard])

  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {status === "setup" && (
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl">Minimal Automated Battle</CardTitle>
            <p className="text-muted-foreground">Enter character names or use the defaults. Last one standing wins.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {settings.characterNames.map((name, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`char-${index}`}>Character {index + 1}</Label>
                  <Input
                    id={`char-${index}`}
                    value={name}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    maxLength={16}
                    className="w-full"
                    style={{ borderLeft: `4px solid var(--char-color-${index})` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={randomizeNames}>
                <Dices className="mr-2 h-4 w-4" /> Randomize All
              </Button>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sfx-switch"
                    checked={settings.enableSfx}
                    onCheckedChange={(checked) => setSetting("enableSfx", checked)}
                  />
                  <Label htmlFor="sfx-switch">
                    {settings.enableSfx ? (
                      <Volume2 className="h-5 w-5" />
                    ) : (
                      <VolumeX className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="haptics-switch"
                    checked={settings.enableHaptics}
                    onCheckedChange={(checked) => setSetting("enableHaptics", checked)}
                  />
                  <Label htmlFor="haptics-switch">
                    {settings.enableHaptics ? (
                      <Zap className="h-5 w-5" />
                    ) : (
                      <ZapOff className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Label>
                </div>
              </div>
            </div>
            <Button onClick={startGame} className="w-full" size="lg">
              Start Game
            </Button>
          </CardContent>
        </Card>
      )}

      {(status === "countdown" || status === "playing" || status === "finished") && (
        <>
          <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />

          <div className="absolute top-4 left-4">
            <Card className="w-64 bg-background/80 backdrop-blur-sm">
              <CardHeader className="p-3">
                <CardTitle className="text-lg">Leaderboard</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                {sortedLeaderboard.map((char, index) => (
                  <div key={char.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <span className="font-bold mr-2" style={{ color: `var(--char-color-${char.id})` }}>
                        {char.isAlive ? `${index + 1}.` : "☠️"}
                      </span>
                      <span className={`truncate ${!char.isAlive ? "text-muted-foreground line-through" : ""}`}>
                        {char.name}
                      </span>
                    </div>
                    <Badge variant="secondary">{char.kills} Kills</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="absolute top-4 right-4 text-right">
            <div className="text-2xl font-bold bg-background/80 backdrop-blur-sm px-3 py-1 rounded-md">
              {Math.floor(elapsedTime / 60)
                .toString()
                .padStart(2, "0")}
              :
              {Math.floor(elapsedTime % 60)
                .toString()
                .padStart(2, "0")}
            </div>
          </div>

          {status === "countdown" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-9xl font-bold text-white drop-shadow-lg animate-ping-once">{countdown}</span>
            </div>
          )}
        </>
      )}

      {/* Dialog opens when status is "finished" */}
      <Dialog open={status === "finished"} onOpenChange={(open) => !open && resetGame()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-3xl text-center">
              {winner && (Array.isArray(winner) ? "It's a Tie!" : "Game Over!")}
            </DialogTitle>
            <DialogDescription className="text-center pt-4">
              {winner &&
                (Array.isArray(winner) ? (
                  <>
                    <div className="text-lg mb-2">It's a tie between:</div>
                    <div className="flex justify-center gap-4">
                      {winner.map((w) => (
                        <span key={w.id} className="font-bold text-xl" style={{ color: `var(--char-color-${w.id})` }}>
                          {w.name}
                        </span>
                      ))}
                    </div>
                    <div className="text-lg mt-2">Well fought!</div>
                  </>
                ) : (
                  <>
                    <div className="text-lg mb-2">Congratulations to the winner!</div>
                    <span className="font-bold text-2xl" style={{ color: `var(--char-color-${winner.id})` }}>
                      {winner.name}
                    </span>
                  </>
                ))}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-4">
            <Button onClick={resetGame} size="lg">
              Play Again
            </Button>
            <Button
              onClick={() => {
                resetGame("setup")
              }}
              variant="outline"
            >
              Edit Names
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
