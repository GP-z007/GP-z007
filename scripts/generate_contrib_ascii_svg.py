#!/usr/bin/env python3
from __future__ import annotations
import json
import os
import urllib.request
from datetime import date, timedelta
from pathlib import Path

USERNAME = os.environ.get('USERNAME', 'GP-z007')
TOKEN = os.environ.get('GITHUB_TOKEN')
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'contrib_ascii.svg'

QUERY = '''
query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
    }
  }
}
'''


def gh_graphql(query: str, variables: dict) -> dict:
    if not TOKEN:
        raise SystemExit('Missing GITHUB_TOKEN')
    req = urllib.request.Request(
        'https://api.github.com/graphql',
        data=json.dumps({'query': query, 'variables': variables}).encode('utf-8'),
        headers={
            'Authorization': f'Bearer {TOKEN}',
            'Content-Type': 'application/json',
            'User-Agent': 'ascii-contrib-generator',
        },
        method='POST',
    )
    with urllib.request.urlopen(req) as resp:
        payload = json.loads(resp.read().decode('utf-8'))
    if 'errors' in payload:
        raise SystemExit(str(payload['errors']))
    return payload['data']


def render_ascii_terrain(matrix: list[list[int]], username: str) -> list[str]:
    rows = len(matrix)
    cols = len(matrix[0]) if rows else 0
    shades = ' .:-=+*#%@'
    lines: list[str] = []
    lines.append('')
    lines.append(f'  {username}  ::  ASCII 3D CONTRIBUTION GRAPH')
    lines.append('')
    for depth_row in range(rows - 1, -1, -1):
        indent = ' ' * (depth_row * 2)
        top_line = indent
        mid_line = indent
        base_line = indent
        for c in range(cols):
            h = matrix[depth_row][c]
            ch = shades[min(h, len(shades) - 1)]
            if h == 0:
                top_line += '    '
                mid_line += '    '
                base_line += '    '
            else:
                top_line += ' /\\ '
                mid_line += f'/{ch}{ch}' + '\\'
                base_line += '\\' + f'{ch}{ch}/'
        lines.extend([top_line.rstrip(), mid_line.rstrip(), base_line.rstrip()])
    lines.append('')
    lines.append('  S U N                                   W E E K S                                 S A T')
    lines.append('')
    return lines


def svg_from_lines(lines, out_path, font_size=10, pad_x=18, pad_y=24, bg='#0d1117', fg='#c9d1d9'):
    lines = [line.rstrip('\n') for line in lines]
    max_chars = max(len(line) for line in lines) if lines else 1
    width = int(max_chars * font_size * 0.62 + pad_x * 2)
    line_height = int(font_size * 1.35)
    height = int(len(lines) * line_height + pad_y * 2)

    def esc(s: str) -> str:
        return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

    text_elems = []
    y = pad_y + font_size
    for line in lines:
        text_elems.append(f'<text x="{pad_x}" y="{y}" xml:space="preserve">{esc(line)}</text>')
        y += line_height

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="ASCII contribution graph" preserveAspectRatio="xMidYMid meet">
  <rect width="100%" height="100%" fill="{bg}" rx="18"/>
  <g fill="{fg}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace" font-size="{font_size}" letter-spacing="0.3">
    {''.join(text_elems)}
  </g>
</svg>'''
    out_path.write_text(svg, encoding='utf-8')


def main():
    today = date.today()
    start = today - timedelta(days=371)
    data = gh_graphql(QUERY, {
        'login': USERNAME,
        'from': f'{start.isoformat()}T00:00:00Z',
        'to': f'{today.isoformat()}T23:59:59Z',
    })
    weeks = data['user']['contributionsCollection']['contributionCalendar']['weeks']
    counts = []
    for week in weeks:
        days = week['contributionDays']
        if len(days) < 7:
            days = days + [{'contributionCount': 0}] * (7 - len(days))
        counts.append([d['contributionCount'] for d in days[:7]])
    matrix = [[counts[c][r] for c in range(len(counts))] for r in range(7)]
    flat = [v for row in matrix for v in row]
    maxv = max(flat) if flat else 0
    if maxv == 0:
        scaled = [[0 for _ in row] for row in matrix]
    else:
        scaled = [[min(9, int(round((v / maxv) * 9))) for v in row] for row in matrix]
    lines = render_ascii_terrain(scaled, USERNAME)
    svg_from_lines(lines, OUT)
    print(f'Wrote {OUT}')


if __name__ == '__main__':
    main()
