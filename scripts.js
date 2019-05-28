$(document).ready(() => {
    const particle = new Particle()
    const token = "1346bf711995c0318546317c12d30f54506339fb"

    const animals = [
        ['sanglier', 'cochon', 'porc'], // 0 -> Sanglier
        ['bambie', 'biche']             // 1 -> Biche
    ]

    const states = [
        [], // 0 -> Disabled
        ['loupé', 'raté', 'passé', 'manqué'],    // 1 -> Raté
        ['blessé', 'toucher', 'touché'],           // 2 -> Touché
        ['tué', 'mort', 'descendu', 'abauttu', 'défoncé'] // 3 -> Tué
    ]

    const resetStateDelay = 30 * 1000

    animalsStates = [
        [0, 0, 0],
        [0, 0, 0]
    ]

    resetIntervals = [
        [],
        []
    ]

    const $body = $('body')
    const $record = $('#record')
    const $transcript = $('#transcript_content')

    let isRecording = false
    let isDone = false
    let final_transcript = ''

    var recognition = new webkitSpeechRecognition()
    recognition.interimResults = true
    recognition.lang = "fr-FR"

    publishEvent("comhunt_reset", null)

    recognition.onresult = function (event) {
        var interim_transcript = ''

        for (var i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                final_transcript += event.results[i][0].transcript
                endRecordAnalysis()
            } else {
                interim_transcript += event.results[i][0].transcript
                if (!isDone)
                    updateTranscript(interim_transcript)
            }
        }
    }

    function endRecordAnalysis() {
        if (!isDone) {
            let analysis = analyseTranscript(final_transcript)
            stopRecord()

            isDone = true

            setTimeout(() => {
                isDone = false
                $record.removeClass('success')
                $record.removeClass('error')
            }, 2000)

            if (analysis.animal >= 0 && analysis.state) {
                publishEvent("comhunt_animal", analysis.state + "-" + getIndividual(analysis.animal, analysis.state) + "-" + analysis.animal)
                $record.addClass('success')
            } else
                $record.addClass('error')

            final_transcript = ''
        }
    }

    function getIndividual(animal, state) {
        const animalState = animalsStates[animal]

        for (let i = 0; i < animalState.length; i++) {
            if (animalState[i] < state) {
                setState(animal, state, i)
                return i
            }
        }

        for (let i = 0; i < animalState.length; i++) {
            if (animalState[i] == 0) {
                setState(animal, state, i)
                return i
            }
        }

        setState(animal, state, 0)
        return 0
    }

    function setState(animal, state, i) {
        animalsStates[animal][i] = state

        clearInterval(resetIntervals[animal][i])
        resetIntervals[animal][i] = setTimeout(() => {
            animalsStates[animal][i] = 0
            publishEvent("comhunt_animal", 0 + "-" + i + "-" + animal)
        }, resetStateDelay)
    }

    recognition.onerror = function (event) {
        console.log("error", event)
    }

    recognition.onend = function () {
        endRecordAnalysis()
    }

    $record.click(toggleRecord)

    $(window).keydown((event) => {
        if (event.keyCode == 32)
            toggleRecord()
    })

    function toggleRecord() {
        if (!isDone) {
            if (isRecording)
                stopRecord()
            else
                startRecord()
        }
    }

    function startRecord() {
        $transcript.empty()
        recognition.start()
        $record.addClass('recording')
        $body.addClass('recording')
        isRecording = true
    }

    function stopRecord() {
        recognition.stop()
        $record.removeClass('recording')
        $body.removeClass('recording')
        isRecording = false
    }

    function updateTranscript(transcript) {
        const analyse = analyseTranscript(transcript)

        $transcript.html(analyse.transcriptFormated)
    }

    function analyseTranscript(transcript) {
        let analyse = {}
        let animal = null
        let state = null
        let transcriptFormated = transcript

        animals.forEach((_animal, index) => {
            _animal.forEach((animalName) => {
                if (transcript.includes(animalName)) {
                    var regexp = new RegExp(animalName, "gi");
                    transcriptFormated = transcriptFormated.replace(regexp, "<span class='animal'>" + animalName + "</span>");
                    animal = index
                }
            })
        })

        states.forEach((_state, index) => {
            _state.forEach((stateName) => {
                if (transcript.includes(stateName)) {
                    var regexp = new RegExp(stateName, "gi");
                    transcriptFormated = transcriptFormated.replace(regexp, "<span class='status'>" + stateName + "</span>");
                    state = index
                }
            })
        })

        analyse.transcriptFormated = transcriptFormated
        analyse.animal = animal
        analyse.state = state

        return analyse
    }

    function pad(n, width, z) {
        z = z || '0'
        n = n + ''
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n
    }

    function publishEvent(eventName, data) {
        var publishEventPr = particle.publishEvent({ name: eventName, data: data, auth: token });

        publishEventPr.then(
            function (data) {
                if (!data.body.ok) { console.error("Cant send event") }
            },
            function (err) {
                console.error("Failed to publish event: " + err)
            }
        );
    }
})
