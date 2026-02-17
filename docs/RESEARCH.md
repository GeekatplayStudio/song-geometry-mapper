# Research References

This project uses standard DSP and machine listening methods. Below are relevant references for the techniques used in analysis and visualization.

## Audio and Spectral Analysis

1. FFT (fast Fourier transform)
- Cooley, J. W., & Tukey, J. W. (1965). An algorithm for the machine calculation of complex Fourier series.
- DOI: https://doi.org/10.1090/S0025-5718-1965-0178586-1

2. Short-time spectral analysis context
- Allen, J. B., & Rabiner, L. R. (1977). A unified approach to short-time Fourier analysis and synthesis.
- DOI: https://doi.org/10.1109/PROC.1977.10770

3. Librosa (used in Python analyzer)
- McFee, B., et al. (2015). librosa: Audio and music signal analysis in Python.
- DOI: https://doi.org/10.25080/Majora-7b98e3ed-003

## Dimensionality Reduction

1. PCA foundations
- Pearson, K. (1901). On lines and planes of closest fit to systems of points in space.
- DOI: https://doi.org/10.1080/14786440109462720

## Nearest Neighbor Structures

1. k-d tree foundation
- Bentley, J. L. (1975). Multidimensional binary search trees used for associative searching.
- DOI: https://doi.org/10.1145/361002.361007

## Music Source Separation (Demucs)

1. Demucs (waveform domain)
- Defossez, A., et al. (2019). Music Source Separation in the Waveform Domain.
- arXiv: https://arxiv.org/abs/1911.13254

2. Hybrid Demucs
- Rouard, S., Massa, F., & Defossez, A. (2021). Hybrid Spectrogram and Waveform Source Separation.
- arXiv: https://arxiv.org/abs/2111.03600

3. Hybrid Transformer Demucs (HT Demucs)
- Rouard, S., Massa, F., & Defossez, A. (2022). Hybrid Transformers for Music Source Separation.
- arXiv: https://arxiv.org/abs/2211.08553

## Notes

- The browser analyzer implements FFT/descriptor logic directly in `web/app.js`.
- The Python analyzer uses `librosa` APIs for descriptor extraction and `scipy.spatial.cKDTree` for kNN edge generation.
- This repository focuses on practical local analysis/visualization, not training new models.
