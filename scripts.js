$(document).ready(() => {
    const animals = [
        ['wild boar', 'hog', 'oinker', "peccary", 'porker', 'pig'], // 0 -> Sanglier
        ['wapiti', 'elk', 'cervid']             // 1 -> Biche
    ]

    const states = [
        [], // 0 -> Disabled
        ['missed'],    // 1 -> Raté
        ['hit'],           // 2 -> Touché
        ['killed', 'shot', 'dead', 'wiped out', 'drown'] // 3 -> Tué
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
    recognition.lang = "en"

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
                $record.addClass('success')
            } else
                $record.addClass('error')

            final_transcript = ''
        }
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
                    var regexp = new RegExp(animalName.toLowerCase(), "gi");
                    transcriptFormated = transcriptFormated.replace(regexp, "<span class='animal'>" + animalName + "</span>");
                    animal = index
                }
            })
        })

        states.forEach((_state, index) => {
            _state.forEach((stateName) => {
                if (transcript.includes(stateName)) {
                    var regexp = new RegExp(stateName.toLowerCase(), "gi");
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
})
