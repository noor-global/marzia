import json

def update_notebook():
    file_path = "a:\\Roam_Drive01\\Assets\\Operationals\\TMM\\tmm\\TMM.ipynb"
    with open(file_path, "r", encoding="utf-8") as f:
        nb = json.load(f)
        
    sweep_cell_mark = {
      "cell_type": "markdown",
      "metadata": {},
      "source": [
        "## Upgrade 1: Wavelength Sweep (Spectra Plotting)\n",
        "Calculate and plot the Reflectance and Transmittance across the visible spectrum (400 nm to 700 nm)."
      ]
    }

    sweep_cell_code = {
      "cell_type": "code",
      "execution_count": None,
      "metadata": {},
      "outputs": [],
      "source": [
        "import numpy as np\n",
        "import matplotlib.pyplot as plt\n",
        "import tmm\n",
        "\n",
        "lambdas = np.linspace(400, 700, 300) # Wavelengths from 400 to 700 nm\n",
        "R_list = []\n",
        "T_list = []\n",
        "\n",
        "for vac_wl in lambdas:\n",
        "    res = tmm.coh_tmm(pol, n_list, d_list, theta_0, vac_wl)\n",
        "    R_list.append(res['R'])\n",
        "    T_list.append(res['T'])\n",
        "\n",
        "plt.figure(figsize=(10, 5))\n",
        "plt.plot(lambdas, R_list, label='Reflectance (R)', color='blue')\n",
        "plt.plot(lambdas, T_list, label='Transmittance (T)', color='red')\n",
        "plt.xlabel('Wavelength (nm)')\n",
        "plt.ylabel('Fraction')\n",
        "plt.title('Reflectance and Transmittance Spectra')\n",
        "plt.legend()\n",
        "plt.grid(True, alpha=0.3)\n",
        "plt.show()"
      ]
    }

    absorb_cell_mark = {
      "cell_type": "markdown",
      "metadata": {},
      "source": [
        "## Upgrade 2: Absorbing Material (Complex Refractive Index)\n",
        "We add a thin metallic layer (e.g., Gold) to observe non-zero absorption. Metallic layers are modelled with a complex refractive index ($n + ik$)."
      ]
    }

    absorb_cell_code = {
      "cell_type": "code",
      "execution_count": None,
      "metadata": {},
      "outputs": [],
      "source": [
        "# Example Structure: Air / MgF2 (100nm) / Gold (30nm) / TiO2 (50nm) / Glass\n",
        "# Gold refractive index at ~500nm is approx 0.8 + 1.8j\n",
        "n_list_abs = [1.0, 1.38, 0.8 + 1.8j, 2.4, 1.5]\n",
        "d_list_abs = [np.inf, 100, 30, 50, np.inf]\n",
        "\n",
        "results_abs = tmm.coh_tmm(pol, n_list_abs, d_list_abs, theta_0, lambda_vac)\n",
        "print(f\"Reflectance: {results_abs['R']:.4f}\")\n",
        "print(f\"Transmittance: {results_abs['T']:.4f}\")\n",
        "print(f\"Absorption: {1 - results_abs['R'] - results_abs['T']:.4f}\")\n",
        "\n",
        "z_abs = np.linspace(0, 230, 400)\n",
        "intensities_abs = []\n",
        "absorption_profile_abs = []\n",
        "\n",
        "for z in z_abs:\n",
        "    layer_idx, dist_in_layer = tmm.find_in_structure_with_inf(d_list_abs, z)\n",
        "    res = tmm.position_resolved(layer_idx, dist_in_layer, results_abs)\n",
        "    intensity = np.abs(res['Ey'])**2\n",
        "    intensities_abs.append(intensity)\n",
        "    n_z = n_list_abs[layer_idx]\n",
        "    local_abs = (np.real(n_z) * np.imag(n_z)) * intensity\n",
        "    absorption_profile_abs.append(local_abs)\n",
        "\n",
        "# Plotting\n",
        "fig, ax1 = plt.subplots(figsize=(10, 6))\n",
        "line1, = ax1.plot(z_abs, intensities_abs, color=\"blue\", label=\"Field Intensity |E|^2\")\n",
        "ax1.set_xlabel(\"Depth (nm)\")\n",
        "ax1.set_ylabel(\"Intensity |E|^2\", color=\"blue\")\n",
        "\n",
        "ax2 = ax1.twinx()\n",
        "line2, = ax2.plot(z_abs, absorption_profile_abs, color=\"red\", linestyle=\"--\", label=\"Absorption Profile\")\n",
        "ax2.set_ylabel(\"Local Absorption\", color=\"red\")\n",
        "\n",
        "# Adding layer interfaces\n",
        "plt.axvline(x=100, color=\"gray\", linestyle=\":\")\n",
        "plt.axvline(x=130, color=\"gold\", linestyle=\":\")\n",
        "plt.axvline(x=180, color=\"black\", linestyle=\":\")\n",
        "\n",
        "# Annotations\n",
        "plt.text(50, ax1.get_ylim()[1]*0.9, \"MgF2\", horizontalalignment=\"center\", fontweight=\"bold\")\n",
        "plt.text(115, ax1.get_ylim()[1]*0.9, \"Au\", horizontalalignment=\"center\", fontweight=\"bold\")\n",
        "plt.text(155, ax1.get_ylim()[1]*0.9, \"TiO2\", horizontalalignment=\"center\", fontweight=\"bold\")\n",
        "plt.text(205, ax1.get_ylim()[1]*0.9, \"Glass\", horizontalalignment=\"center\", fontweight=\"bold\")\n",
        "plt.title(\"Absorption Spike in Metallic Layer\")\n",
        "\n",
        "lines = [line1, line2]\n",
        "ax1.legend(lines, [l.get_label() for l in lines], loc=\"upper left\")\n",
        "plt.tight_layout()\n",
        "plt.show()"
      ]
    }

    interactive_cell_mark = {
      "cell_type": "markdown",
      "metadata": {},
      "source": [
        "## Upgrade 3: Interactive Simulation with `ipywidgets`\n",
        "Use interactive sliders to adjust wavelengths, layer thicknesses, and incident angles, calculating parameters dynamically."
      ]
    }

    interactive_cell_code = {
      "cell_type": "code",
      "execution_count": None,
      "metadata": {},
      "outputs": [],
      "source": [
        "import ipywidgets as widgets\n",
        "from IPython.display import display\n",
        "\n",
        "def interactive_tmm(wl, d_mgf2, d_tio2, theta_deg):\n",
        "    theta_rad = np.radians(theta_deg)\n",
        "    n_list = [1.0, 1.38, 2.4, 1.5]\n",
        "    d_list = [np.inf, d_mgf2, d_tio2, np.inf]\n",
        "    \n",
        "    res = tmm.coh_tmm('s', n_list, d_list, theta_rad, wl)\n",
        "    print(f\"Reflectance: {res['R']*100:.2f}%\")\n",
        "    print(f\"Transmittance: {res['T']*100:.2f}%\")\n",
        "\n",
        "widgets.interact(interactive_tmm,\n",
        "                 wl=widgets.FloatSlider(value=500, min=400, max=700, step=10, description='Wavelength (nm):'),\n",
        "                 d_mgf2=widgets.FloatSlider(value=100, min=0, max=300, step=10, description='MgF2 (nm):'),\n",
        "                 d_tio2=widgets.FloatSlider(value=50, min=0, max=300, step=10, description='TiO2 (nm):'),\n",
        "                 theta_deg=widgets.FloatSlider(value=0, min=0, max=89, step=1, description='Angle (deg):'))"
      ]
    }

    nb['cells'].extend([
      sweep_cell_mark, sweep_cell_code, 
      absorb_cell_mark, absorb_cell_code, 
      interactive_cell_mark, interactive_cell_code
    ])

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(nb, f, indent=2)

if __name__ == '__main__':
    update_notebook()
