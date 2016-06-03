# BRDF Explorer

## Try it
You can see it live [here!](http://corralx.me/BRDFExplorer/?antialiasing=true)

## About
BRDF Explorer is a simple tool built to provide a visual comparison between different [BRDF models](https://en.wikipedia.org/wiki/Bidirectional_reflectance_distribution_function) commonly used in 3D graphics.
The implemented models are the following.

For the diffuse component:
* [Lambert](https://en.wikipedia.org/wiki/Lambertian_reflectance)
* [Burley](https://disney-animation.s3.amazonaws.com/library/s2012_pbs_disney_brdf_notes_v2.pdf)
* [Oren-Nayar](http://www1.cs.columbia.edu/CAVE/publications/pdfs/Oren_SIGGRAPH94.pdf)

For the distribution term of the specular component:
* [Beckmann](https://en.wikipedia.org/wiki/Specular_highlight#Beckmann_distribution)
* [Blinn-Phong](http://research.microsoft.com/pubs/73852/p192-blinn.pdf)
* [GGX](https://www.cs.cornell.edu/~srm/publications/EGSR07-btdf.pdf)

For the geometric (or shadowing) term of the specular component:
* Implicit
* [Cook-Torrance](http://www.cs.columbia.edu/~belhumeur/courses/appearance/cook-torrance.pdf)
* [Kelemen](http://sirkan.iit.bme.hu/~szirmay/scook.pdf)
* [Neumann](http://sirkan.iit.bme.hu/~szirmay/brdf6.pdf)
* [Beckmann](https://www.cs.cornell.edu/~srm/publications/EGSR07-btdf.pdf)
* [GGX](https://www.cs.cornell.edu/~srm/publications/EGSR07-btdf.pdf)
* [Schlick](https://www.cs.virginia.edu/~jdl/bib/appearance/analytic%20models/schlick94b.pdf)

For the Fresnel term of the specular component:
* None
* [Cook-Torrance](http://www.cs.columbia.edu/~belhumeur/courses/appearance/cook-torrance.pdf)
* [Schlick](https://en.wikipedia.org/wiki/Schlick's_approximation)

Moreover the following roughness remapping are given to the user:
* [Crytek](http://www.crytek.com/download/2014_03_25_CRYENGINE_GDC_Schultz.pdf)
* [Epig Games](http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_slides.pdf)

**NOTE:** Despite the similarity in the name, this tool does not aim to be an alternative to [BRDF Explorer](http://www.disneyanimation.com/technology/brdf.html) built by Disney Animation Studios.
Its scope is much more limited and served both as an exercise to implement first hand the BRDF models in GLSL, and to have some visual feedbacks about the differences between models.

### Reference
* http://graphicrants.blogspot.it/2013/08/specular-brdf-reference.html
* http://simonstechblog.blogspot.it/2011/12/microfacet-brdf.html
* http://www.frostbite.com/wp-content/uploads/2014/11/course_notes_moving_frostbite_to_pbr.pdf
* https://disney-animation.s3.amazonaws.com/library/s2012_pbs_disney_brdf_notes_v2.pdf
* https://de45xmedrsdbp.cloudfront.net/Resources/files/2013SiggraphPresentationsNotes-26915738.pdf
* http://www.crytek.com/download/2014_03_25_CRYENGINE_GDC_Schultz.pdf
* https://seblagarde.wordpress.com/2011/08/17/hello-world/
* https://seblagarde.files.wordpress.com/2013/08/gdce13_lagarde_harduin_light.pdf
* https://seblagarde.wordpress.com/2013/04/29/memo-on-fresnel-equations/

### Compatibility
The tool has been tested on Firefox, Chrome, Safari, Opera and Edge, both desktop and mobile.
Its only requirement is a fairly recent browser with WebGL support.

## Future Work
* Implement other [BRDF models](http://digibug.ugr.es/bitstream/10481/19751/1/rmontes_LSI-2012-001TR.pdf)
* Let the user write its own models through a text editor directly inside the application

## License
It is licensed under the very permissive [MIT License](https://opensource.org/licenses/MIT).
For the complete license see the provided [LICENSE](https://github.com/Corralx/BRDFExplorer/blob/master/LICENSE.md) file in the root directory.

## Thanks
BRDF Explorer is built upon the following libraries:
* [Three.js](http://threejs.org/)
* [jQuery](https://jquery.com/)
* [dat.gui](https://github.com/dataarts/dat.gui)
* [renderstats](https://github.com/jeromeetienne/threex.rendererstats)
* [assimp2json](https://github.com/acgessler/assimp2json)
* [notify.js](https://notifyjs.com/)
* [highlight.js](https://github.com/isagalaev/highlight.js)
