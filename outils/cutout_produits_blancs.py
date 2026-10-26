import sys,os,numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
src,out=sys.argv[1:3]; os.makedirs(out,exist_ok=True)
for f in sorted(os.listdir(src)):
    im=np.asarray(Image.open(os.path.join(src,f)).convert('RGB')).astype(int)
    cand=(im.min(axis=2)>251)&((im.max(axis=2)-im.min(axis=2))<6)
    lab,n=ndimage.label(cand)
    border=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    bg=np.isin(lab,list(border))
    fg=~bg
    fg=ndimage.binary_opening(fg,iterations=1)
    lab2,n2=ndimage.label(fg)
    if n2>1:
        sizes=np.asarray(ndimage.sum(fg,lab2,range(1,n2+1))); keep=[i+1 for i,v in enumerate(sizes) if v>=0.03*sizes.max()]; fg=np.isin(lab2,keep)
    fg=ndimage.binary_fill_holes(fg)
    a=Image.fromarray((fg*255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.8))
    rgba=Image.open(os.path.join(src,f)).convert('RGBA'); rgba.putalpha(a)
    rgba=rgba.crop(rgba.getbbox())
    rgba.save(os.path.join(out,f.rsplit('.',1)[0]+'.png'))
    print(f,rgba.size)
