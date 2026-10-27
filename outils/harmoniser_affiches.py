import sys,os,numpy as np, cv2
src,dst,demo_path=sys.argv[1:4]
demo=cv2.imread(demo_path)
dm=np.ones(demo.shape[:2],bool); dm[424:1137,178:902]=False; dm[:300,:]=False
dlab=cv2.cvtColor(demo,cv2.COLOR_BGR2LAB).astype(np.float32); dmean,dstd=dlab[dm].mean(0),dlab[dm].std(0)
CREAM=np.array([238,244,250],np.float32)  # BGR #FAF4EE
def process(path,recolor):
    im=cv2.imread(path); H,W=im.shape[:2]
    white=(im.min(2)>=246).astype(np.uint8)
    n,lbl,st,_=cv2.connectedComponentsWithStats(white,connectivity=4)
    big=1+np.argmax(st[1:,cv2.CC_STAT_AREA]); x,y,w,h=st[big,:4]
    out=im.astype(np.float32)
    if recolor:
        lab=cv2.cvtColor(im,cv2.COLOR_BGR2LAB).astype(np.float32)
        m=np.ones((H,W),bool); m[y:y+h,x:x+w]=False
        smean,sstd=lab[m].mean(0),lab[m].std(0)
        for c in (1,2):
            ch=lab[...,c]; ch[m]=(ch[m]-smean[c])*(dstd[c]/max(sstd[c],1e-3))*0.9+dmean[c]
        rec=cv2.cvtColor(np.clip(lab,0,255).astype(np.uint8),cv2.COLOR_LAB2BGR).astype(np.float32)
        out[m]=rec[m]
    # fond blanc du cadre (composante connexe) -> crème, avec bord adouci
    bgm=(lbl==big).astype(np.float32)
    bgm=cv2.GaussianBlur(bgm,(0,0),1.2)[...,None]
    # léger dégradé vertical dans le cadre
    grad=np.linspace(1.0,0.965,H,dtype=np.float32)[:,None,None]
    cream=CREAM[None,None,:]*grad
    out=out*(1-bgm)+cream*bgm
    cv2.imwrite(os.path.join(dst,os.path.basename(path)),np.clip(out,0,255).astype(np.uint8),[cv2.IMWRITE_JPEG_QUALITY,93])
os.makedirs(dst,exist_ok=True)
for root,_,fs in os.walk(src):
    for f in sorted(fs):
        if not f.endswith('.jpg'): continue
        code=f.split('__')[2]
        process(os.path.join(root,f), recolor=code in ('productbenefit','producthowto','productinterest'))
print('done')
