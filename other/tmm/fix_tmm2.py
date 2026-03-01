import json

def fix_notebook_undefined_res():
    file_path = "a:\\Roam_Drive01\\Assets\\Operationals\\TMM\\tmm\\TMM.ipynb"
    with open(file_path, "r", encoding="utf-8") as f:
        nb = json.load(f)
        
    for cell in nb.get('cells', []):
        if cell['cell_type'] == 'code':
            source = "".join(cell.get('source', []))
            # Find the cell that had the commented out import and the 'ez_list.append(res)'
            if "ez_list.append(res)" in source and "tmm.position_resolved" in source:
                new_source = []
                for line in cell['source']:
                    if not line.strip().startswith("#"):
                        # Comment out any actual code in this block to prevent NameError
                        new_source.append("# " + line)
                    else:
                        new_source.append(line)
                cell['source'] = new_source

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(nb, f, indent=2)

if __name__ == '__main__':
    fix_notebook_undefined_res()
