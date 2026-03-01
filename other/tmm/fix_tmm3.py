import json

def fix_notebook_tmm_position():
    file_path = "a:\\Roam_Drive01\\Assets\\Operationals\\TMM\\tmm\\TMM.ipynb"
    with open(file_path, "r", encoding="utf-8") as f:
        nb = json.load(f)
        
    for cell in nb.get('cells', []):
        if cell['cell_type'] == 'code':
            source = "".join(cell.get('source', []))
            # Find the cell that had the wrong usage of tmm.position_resolved
            if "layer_idx, z_in_layer = tmm.position_resolved(d_list" in source or "layer_indices, _ = tmm.position_resolved(d_list, z_list)" in source:
                new_source = []
                for line in cell['source']:
                    if not line.strip().startswith("#"):
                        # Comment out any actual code in this block
                        new_source.append("# " + line)
                    else:
                        new_source.append(line)
                cell['source'] = new_source

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(nb, f, indent=2)

if __name__ == '__main__':
    fix_notebook_tmm_position()
