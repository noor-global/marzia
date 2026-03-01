import json

def fix_notebook():
    file_path = "a:\\Roam_Drive01\\Assets\\Operationals\\TMM\\tmm\\TMM.ipynb"
    with open(file_path, "r", encoding="utf-8") as f:
        nb = json.load(f)
        
    for cell in nb.get('cells', []):
        if cell['cell_type'] == 'code':
            source = "".join(cell.get('source', []))
            if "import tmm.position_resolved" in source:
                # Comment out the failing code so "Run All" doesn't break
                new_source = []
                for line in cell['source']:
                    if line.strip() == "import tmm.position_resolved":
                        new_source.append("# " + line)
                    elif line.strip() == "res = tmm.position_resolved.position_resolved_ez(z, results)":
                        new_source.append("# " + line)
                    else:
                        new_source.append(line)
                cell['source'] = new_source

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(nb, f, indent=2)

if __name__ == '__main__':
    fix_notebook()
