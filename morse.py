import time


def on(millisecond):
    pass


try:
    unit = int(input('one unit(millisecond, default=100) : '))
except ValueError:
    print('Unit either didn\'t enter or invalid, default to 100 millisecond')
    unit = 100
text = input('text : ')
dict = {
    ' ': ' ',
    'A': '.-',
    'B': '.---',
    'C': '-.-.',
    'D': '-..',
    'E': '.',
    'F': '..-.',
    'G': '--.',
    'H': '....',
    'I': '..',
    'J': '.---',
    'K': '-.-',
    'L': '.-..',
    'M': '--',
    'N': '-.',
    'O': '---',
    'P': '.--.',
    'Q': '--.-',
    'R': '.-.',
    'S': '...',
    'T': '-',
    'U': '..-',
    'V': '...-',
    'W': '.--',
    'X': '-..-',
    'Y': '-.--',
    'Z': '--..',
    '1': '.----',
    '2': '..---',
    '3': '...--',
    '4': '....-',
    '5': '.....',
    '6': '-....',
    '7': '--...',
    '8': '---..',
    '9': '----.',
    '0': '-----',
    '.': '.-.-.-',
    ',': '--..--',
    '?': '..--..',
    '!': '-.-.--',
    ':': '---...',
    '"': '.-..-.',
    '\'': '.----.',
    '=': '-...-',
    '/': '-..-.',
    '(': '-.--.',
    ')': '-.--.-',
    '&': '.-...',
    ';': '-.-.-.',
    '+': '.-.-.',
    '-': '-....-',
    '_': '..--.-',
    '$': '...-..-',
    '@': '.--.-.',

}

wordbreak = ' '

result = ''
for letter in text:
    result += dict.get(letter.upper(), '?') + 'b'
print(result.replace('b', wordbreak))

# i=0
# firstChar=True
for point in result:
    if point == '.':
        print(point, end='')
        # if firstChar:
        #     print(f'\v{text[i]}\b \033[1;1H')
        #     firstChar=False
        on(unit)
    elif point == '-':
        print(point, end='')
        # if firstChar:
        #     print(f'\v{text[i]}\b \033[1;1H')
        #     firstChar=False
        on(unit * 3)
    else:
        print((' ' if point == 'b' else point), end='')
        # if firstChar:
        #     print(f'\v{text[i]}\b\x1b\x5b\x41')
        #     firstChar=False
        time.sleep(unit / 1000)
        # if point=='b':
        #     i+=1
        #     firstChar=True
    time.sleep(unit / 1000)
