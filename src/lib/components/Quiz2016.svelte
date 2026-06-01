<script lang="ts">
  const questions = [
    {
      q: 'Welches Land gewann die UEFA Euro 2016?',
      options: ['Deutschland', 'Frankreich', 'Portugal', 'Wales'],
      answer: 2,
      hint: 'Cristiano Ronaldo weinte — aber am Ende doch aus Freude.'
    },
    {
      q: 'Welches Spiel wurde im Sommer 2016 zum weltweiten Phänomen?',
      options: ['Overwatch', 'Pokémon GO', 'Fortnite', 'Clash Royale'],
      answer: 1,
      hint: 'Parks und Straßen füllten sich plötzlich mit Smartphone-Zombies.'
    },
    {
      q: 'Was entfernte Apple kontrovers beim iPhone 7?',
      options: ['Den Home-Button', 'Die SIM-Karte', 'Face ID', 'Den Kopfhöreranschluss'],
      answer: 3,
      hint: 'Kopfhörerhersteller rieben sich die Hände.'
    },
    {
      q: 'Welche Musiklegende starb im Januar 2016?',
      options: ['Prince', 'David Bowie', 'George Michael', 'Leonard Cohen'],
      answer: 1,
      hint: 'Ziggy Stardust verabschiedete sich — gerade mal zwei Tage nach seinem letzten Album.'
    },
    {
      q: 'Welches Team gewann sensationell die Premier League 2015/16?',
      options: ['Arsenal', 'Chelsea', 'Leicester City', 'Tottenham'],
      answer: 2,
      hint: 'Die Buchmacher hatten 5000:1 dagegen gewettet.'
    },
    {
      q: 'Wer gewann die US-Präsidentschaftswahl im November 2016?',
      options: ['Hillary Clinton', 'Bernie Sanders', 'Jeb Bush', 'Donald Trump'],
      answer: 3,
      hint: 'Die halbe Welt schaute fassungslos auf die Wahlergebnisse.'
    },
    {
      q: 'Wo fanden die Olympischen Sommerspiele 2016 statt?',
      options: ['Rio de Janeiro', 'Tokio', 'Chicago', 'Madrid'],
      answer: 0,
      hint: 'Die Wasserqualität im Schwimmbecken sorgte für Schlagzeilen.'
    },
    {
      q: 'Welches Beyoncé-Album erschien im April 2016?',
      options: ['Renaissance', 'Lemonade', 'Beyoncé', '4'],
      answer: 1,
      hint: '"Sorry" — aber nicht an die Fans.'
    },
    {
      q: 'Wofür wurde das Samsung Galaxy Note 7 zurückgerufen?',
      options: ['Software-Fehler', 'Kamera-Mängel', 'Feuergefährliche Akkus', 'Wasserschäden'],
      answer: 2,
      hint: 'Fluggesellschaften verboten es im Handgepäck.'
    },
    {
      q: 'Welche Funktion kopierte Instagram 2016 von Snapchat?',
      options: ['Reels', 'Close Friends', 'Broadcast-Channels', 'Stories'],
      answer: 3,
      hint: 'Der Snapchat-CEO nannte es Diebstahl. Die Nutzer wechselten trotzdem.'
    },
  ];

  let current = $state(0);
  let selected = $state<number | null>(null);
  let score = $state(0);
  let done = $state(false);
  let showHint = $state(false);

  function pick(i: number) {
    if (selected !== null) return;
    selected = i;
    if (i === questions[current].answer) score++;
    showHint = true;
  }

  function next() {
    if (current < questions.length - 1) {
      current++;
      selected = null;
      showHint = false;
    } else {
      done = true;
    }
  }

  function restart() {
    current = 0;
    selected = null;
    score = 0;
    done = false;
    showHint = false;
  }

  let resultMsg = $derived(
    score === 10 ? 'Perfekt! Du warst 2016 definitiv wach. 🏆' :
    score >= 7  ? 'Stark! Klassenwissen vom Feinsten. 🎉' :
    score >= 4  ? 'Geht so… warst du 2016 zu abgelenkt? 😅' :
                  'Hmm. Warst du 2016 überhaupt dabei? 😬'
  );
</script>

<div class="quiz-wrap">
  <div class="quiz-eyebrow">Mini-Quiz</div>
  <h2 class="quiz-title">Was weißt du noch über 2016?</h2>

  {#if !done}
    <div class="quiz-progress-bar">
      <div class="quiz-progress-fill" style="width:{((current) / questions.length) * 100}%"></div>
    </div>
    <div class="quiz-counter">{current + 1} / {questions.length}</div>

    <div class="quiz-card">
      <div class="quiz-q">{questions[current].q}</div>
      <div class="quiz-options">
        {#each questions[current].options as opt, i}
          {@const isCorrect = i === questions[current].answer}
          {@const isSelected = i === selected}
          <button
            class="quiz-opt"
            class:correct={selected !== null && isCorrect}
            class:wrong={isSelected && !isCorrect}
            class:dimmed={selected !== null && !isCorrect && !isSelected}
            onclick={() => pick(i)}
            disabled={selected !== null}
          >
            {opt}
          </button>
        {/each}
      </div>

      {#if showHint}
        <div class="quiz-hint">{questions[current].hint}</div>
        <button class="quiz-next" onclick={next}>
          {current < questions.length - 1 ? 'Nächste Frage →' : 'Ergebnis sehen'}
        </button>
      {/if}
    </div>
  {:else}
    <div class="quiz-card quiz-result">
      <div class="result-score">{score}<span>/{questions.length}</span></div>
      <div class="result-msg">{resultMsg}</div>
      <button class="quiz-next" onclick={restart}>Nochmal spielen</button>
    </div>
  {/if}
</div>

<style>
  .quiz-wrap { padding: 2.5rem 1.5rem 3rem; max-width: 480px; margin: 0 auto; }
  .quiz-eyebrow { font-size: 10px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ink3); margin-bottom: .4rem; }
  .quiz-title { font-family: var(--serif); font-size: 1.5rem; color: var(--ink); margin-bottom: 1.5rem; }

  .quiz-progress-bar { height: 4px; background: #eee; border-radius: 2px; margin-bottom: .4rem; overflow: hidden; }
  .quiz-progress-fill { height: 100%; background: var(--accent); border-radius: 2px; transition: width .4s ease; }
  .quiz-counter { font-size: 11px; color: var(--ink3); margin-bottom: 1.25rem; }

  .quiz-card { background: #fff; border: 1.5px solid var(--border); border-radius: 16px; padding: 1.5rem; }
  .quiz-q { font-family: var(--serif); font-size: 1.1rem; color: var(--ink); margin-bottom: 1.25rem; line-height: 1.4; }

  .quiz-options { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; margin-bottom: .75rem; }
  .quiz-opt { padding: .7rem .75rem; border: 1.5px solid var(--border); border-radius: 10px; background: #fff; cursor: pointer; font-size: 13px; font-family: var(--sans); color: var(--ink2); text-align: left; line-height: 1.3; transition: all .15s; }
  .quiz-opt:not(:disabled):hover { border-color: var(--accent); color: var(--accent); background: #fff8f5; }
  .quiz-opt:disabled { cursor: default; }
  .quiz-opt.correct { border-color: var(--green); background: #f4faf5; color: var(--green); font-weight: 600; }
  .quiz-opt.wrong { border-color: var(--red); background: #fdecea; color: var(--red); }
  .quiz-opt.dimmed { opacity: .4; }

  .quiz-hint { font-size: 12px; color: var(--ink3); margin-bottom: 1rem; line-height: 1.5; font-style: italic; }

  .quiz-next { width: 100%; padding: .75rem; background: var(--ink); color: #fff; border: none; border-radius: 10px; font-size: 14px; font-family: var(--sans); font-weight: 500; cursor: pointer; transition: background .15s; }
  .quiz-next:hover { background: #333; }

  .quiz-result { text-align: center; padding: 2.5rem 1.5rem; }
  .result-score { font-family: var(--serif); font-size: 4rem; line-height: 1; color: var(--ink); margin-bottom: .5rem; }
  .result-score span { font-size: 1.5rem; color: var(--ink3); }
  .result-msg { font-size: 15px; color: var(--ink2); margin-bottom: 1.75rem; line-height: 1.5; }
</style>
